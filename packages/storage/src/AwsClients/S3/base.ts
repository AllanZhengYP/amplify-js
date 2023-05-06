// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { getDnsSuffix } from '@aws-amplify/core/lib-esm/clients/endpoints';
import {
	jitteredBackoff,
	getRetryDecider,
	EndpointResolverOptions,
} from '@aws-amplify/core/internals/aws-client-utils';
import { parseXmlError } from './utils';

/**
 * The service name used to sign requests if the API requires authentication.
 */
const SERVICE_NAME = 's3';

type InputParametersForEndpoint = {
	Bucket: string;
	Key: string;
};

/**
 * The endpoint resolver function that returns the endpoint URL for a given region, and input parameters.
 */
const endpointResolver = (
	{ region }: EndpointResolverOptions,
	{ Bucket: bucket, Key: key }: InputParametersForEndpoint
) => ({
	url: new URL(`https://${bucket}.s3.${region}.${getDnsSuffix(region)}/${key}`),
});

/**
 * @internal
 */
export const defaultConfig = {
	service: SERVICE_NAME,
	endpointResolver,
	retryDecider: getRetryDecider(parseXmlError),
	computeDelay: jitteredBackoff,
	userAgentValue: getAmplifyUserAgent(), // TODO: use getAmplifyUserAgentString() when available.
};

/**
 * @internal
 */
export const getSharedHeaders = (): Headers => ({
	'content-type': 'application/json',
});
