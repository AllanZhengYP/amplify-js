// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { AmplifyClassV6 } from '@aws-amplify/core';
import {
	HttpRequest,
	unauthenticatedHandler,
	Headers,
	getRetryDecider,
	jitteredBackoff,
	authenticatedHandler,
} from '@aws-amplify/core/internals/aws-client-utils';

import { DocumentType } from '../types';
import {
	createCancellableOperation,
	parseRestApiServiceError,
	parseUrl,
	resolveCredentials,
} from '../utils';
import { normalizeHeaders } from '../utils/normalizeHeaders';

type HandlerOptions = Omit<HttpRequest, 'body' | 'headers'> & {
	body?: DocumentType | FormData;
	headers?: Headers;
	withCredentials?: boolean;
};

type SigningServiceInfo = {
	service?: string;
	region?: string;
};

/**
 * Make REST API call with best-effort IAM auth.
 * @param amplify Amplify instance to to resolve credentials and tokens. Should use different instance in client-side
 *   and SSR
 * @param options Options accepted from public API options when calling the handlers.
 * @param signingServiceInfo Internal-only options for graphql client to overwrite the IAM signing service and region.
 *   MUST ONLY be used by internal post method consumed by GraphQL when auth mode is IAM. Otherwise IAM auth may not be
 *   used.
 *
 * @internal
 */
export const transferHandler = (
	amplify: AmplifyClassV6,
	options: HandlerOptions,
	signingServiceInfo?: SigningServiceInfo
) =>
	createCancellableOperation(abortSignal =>
		transferHandlerJob(
			amplify,
			{
				...options,
				abortSignal,
			},
			signingServiceInfo
		)
	);

const transferHandlerJob = async (
	amplify: AmplifyClassV6,
	options: HandlerOptions & { abortSignal: AbortSignal },
	signingServiceInfo?: SigningServiceInfo
) => {
	const { url, method, headers, body, withCredentials, abortSignal } = options;
	const resolvedBody = body
		? body instanceof FormData
			? body
			: JSON.stringify(body ?? '')
		: undefined;
	const resolvedHeaders: Headers = {
		...normalizeHeaders(headers),
		...(resolvedBody
			? {
					'content-type':
						body instanceof FormData
							? 'multipart/form-data'
							: 'application/json; charset=UTF-8',
			  }
			: {}),
	};
	const request = {
		url,
		headers: resolvedHeaders,
		method,
		body: resolvedBody,
	};
	const baseOptions = {
		retryDecider: getRetryDecider(parseRestApiServiceError),
		computeDelay: jitteredBackoff,
		withCrossDomainCredentials: withCredentials,
		abortSignal,
	};

	const isIamAuthApplicable = iamAuthApplicable(request, signingServiceInfo);
	if (isIamAuthApplicable) {
		const signingInfoFromUrl = parseUrl(url);
		const signingService =
			signingServiceInfo?.service ?? signingInfoFromUrl.service;
		const signingRegion =
			signingServiceInfo?.region ?? signingInfoFromUrl.region;
		const credentials = await resolveCredentials(amplify);
		return await authenticatedHandler(request, {
			...baseOptions,
			credentials,
			region: signingRegion,
			service: signingService,
		});
	} else {
		return await unauthenticatedHandler(request, {
			...baseOptions,
		});
	}
};

const iamAuthApplicable = (
	{ headers }: HttpRequest,
	signingServiceInfo?: SigningServiceInfo
) => !headers.authorization && !headers['x-api-key'] && !!signingServiceInfo;