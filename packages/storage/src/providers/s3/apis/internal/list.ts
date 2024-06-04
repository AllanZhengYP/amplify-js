// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AmplifyClassV6 } from '@aws-amplify/core';
import { AWSCredentials, StorageAction } from '@aws-amplify/core/internals/utils';

import {
	ListAllInput,
	ListAllOutput,
	ListAllWithPathInput,
	ListAllWithPathOutput,
	ListOutputItem,
	ListOutputItemWithPath,
	ListPaginateInput,
	ListPaginateOutput,
	ListPaginateWithPathInput,
	ListPaginateWithPathOutput,
} from '../../types';
import {
	resolveS3ConfigAndInput,
	validateStorageOperationInputWithPrefix,
} from '../../utils';
import { ResolvedS3Config } from '../../types/options';
import {
	ListObjectsV2Input,
	ListObjectsV2Output,
	listObjectsV2,
} from '../../utils/client';
import { getStorageUserAgentValue } from '../../utils/userAgent';
import { logger } from '../../../../utils';
import { STORAGE_INPUT_PREFIX, LOCAL_TESTING_S3_ENDPOINT } from '../../utils/constants';
import { assertValidationError } from '../../../../errors/utils/assertValidationError';
import { StorageValidationErrorCode } from '../../../../errors/types/validation';

const MAX_PAGE_SIZE = 1000;

interface ListInputArgs {
	s3Config: ResolvedS3Config;
	listParams: ListObjectsV2Input;
	generatedPrefix?: string;
}

export const list = async (
	amplify: AmplifyClassV6,
	input:
		// | ListAllInput
		// | ListPaginateInput
		| ListAllWithPathInput
		| ListPaginateWithPathInput,
): Promise<
	// | ListAllOutput
	// | ListPaginateOutput
	| ListAllWithPathOutput
	| ListPaginateWithPathOutput
> => {
	const { options = {}, path } = input;

	const s3Config = amplify.getConfig()?.Storage?.S3 ?? {};
	const bucket = options.bucket ?? s3Config.bucket;
	assertValidationError(!!bucket, StorageValidationErrorCode.NoBucket);
	const region = options.region ?? s3Config.region;
	assertValidationError(!!region, StorageValidationErrorCode.NoRegion);

	const dangerouslyConnectToHttpEndpointForTesting = s3Config.dangerouslyConnectToHttpEndpointForTesting

	// TODO: type credentials provider to support forceRefresh;
	let credentialsProvider: (() => Promise<AWSCredentials>)|undefined = undefined;
	let objectKey: string|undefined = undefined;
	if (options.locationCredentialsProvider) {
		const identityId = undefined
		objectKey = validateStorageOperationInputWithPrefix(
			input,
			identityId,
		).objectKey;
		// TODO: support force refresh
		credentialsProvider = async () => {
			return options.locationCredentialsProvider!({
				locations: [{bucket, path: objectKey!}],
				permission: 'READ',
				forceRefresh: false,
			})
		}
	} else {
		const { identityId } = await amplify.Auth.fetchAuthSession();
		assertValidationError(!!identityId, StorageValidationErrorCode.NoIdentityId);
		objectKey = validateStorageOperationInputWithPrefix(
			input,
			identityId,
		).objectKey;
		credentialsProvider = async () => {
			const { credentials } = await amplify.Auth.fetchAuthSession();
			assertValidationError(
				!!credentials,
				StorageValidationErrorCode.NoCredentials,
			);
	
			return credentials;
		};
	}
	let identityId: string | undefined = undefined;

	// @ts-expect-error pageSize and nextToken should not coexist with listAll
	if (options?.listAll && (options?.pageSize || options?.nextToken)) {
		const anyOptions = options as any;
		logger.debug(
			`listAll is set to true, ignoring ${anyOptions?.pageSize ? `pageSize: ${anyOptions?.pageSize}` : ''
			} ${anyOptions?.nextToken ? `nextToken: ${anyOptions?.nextToken}` : ''}.`,
		);
	}
	const listParams = {
		Bucket: bucket,
		Prefix: objectKey,
		MaxKeys: options?.listAll ? undefined : options?.pageSize,
		ContinuationToken: options?.listAll ? undefined : options?.nextToken,
	};
	logger.debug(`listing items from "${listParams.Prefix}"`);

	const listInputArgs: ListInputArgs = {
			s3Config: {
				credentials: credentialsProvider,
				region,
				useAccelerateEndpoint: options.useAccelerateEndpoint,
				...(dangerouslyConnectToHttpEndpointForTesting ? {
					customEndpoint: LOCAL_TESTING_S3_ENDPOINT,
					forcePathStyle: true,
				}: {}),
			},
			listParams
		};
	if (options.listAll) {
		// if (isInputWithPrefix) {
		// 	return _listAllWithPrefix({
		// 		...listInputArgs,
		// 		generatedPrefix,
		// 	});
		// } else {
			return _listAllWithPath(listInputArgs);
		// }
	} else {
		// if (isInputWithPrefix) {
		// 	return _listWithPrefix({ ...listInputArgs, generatedPrefix });
		// } else {
			return _listWithPath(listInputArgs);
		// }
	}
};

/** @deprecated Use {@link _listAllWithPath} instead. */
const _listAllWithPrefix = async ({
	s3Config,
	listParams,
	generatedPrefix,
}: ListInputArgs): Promise<ListAllOutput> => {
	const listResult: ListOutputItem[] = [];
	let continuationToken = listParams.ContinuationToken;
	do {
		const { items: pageResults, nextToken: pageNextToken } =
			await _listWithPrefix({
				generatedPrefix,
				s3Config,
				listParams: {
					...listParams,
					ContinuationToken: continuationToken,
					MaxKeys: MAX_PAGE_SIZE,
				},
			});
		listResult.push(...pageResults);
		continuationToken = pageNextToken;
	} while (continuationToken);

	return {
		items: listResult,
	};
};

/** @deprecated Use {@link _listWithPath} instead. */
const _listWithPrefix = async ({
	s3Config,
	listParams,
	generatedPrefix,
}: ListInputArgs): Promise<ListPaginateOutput> => {
	const listParamsClone = { ...listParams };
	if (!listParamsClone.MaxKeys || listParamsClone.MaxKeys > MAX_PAGE_SIZE) {
		logger.debug(`defaulting pageSize to ${MAX_PAGE_SIZE}.`);
		listParamsClone.MaxKeys = MAX_PAGE_SIZE;
	}

	const response: ListObjectsV2Output = await listObjectsV2(
		{
			...s3Config,
			userAgentValue: getStorageUserAgentValue(StorageAction.List),
		},
		listParamsClone,
	);

	if (!response?.Contents) {
		return {
			items: [],
		};
	}

	return {
		items: response.Contents.map(item => ({
			key: generatedPrefix
				? item.Key!.substring(generatedPrefix.length)
				: item.Key!,
			eTag: item.ETag,
			lastModified: item.LastModified,
			size: item.Size,
		})),
		nextToken: response.NextContinuationToken,
	};
};

const _listAllWithPath = async ({
	s3Config,
	listParams,
}: ListInputArgs): Promise<ListAllWithPathOutput> => {
	const listResult: ListOutputItemWithPath[] = [];
	let continuationToken = listParams.ContinuationToken;
	do {
		const { items: pageResults, nextToken: pageNextToken } =
			await _listWithPath({
				s3Config,
				listParams: {
					...listParams,
					ContinuationToken: continuationToken,
					MaxKeys: MAX_PAGE_SIZE,
				},
			});
		listResult.push(...pageResults);
		continuationToken = pageNextToken;
	} while (continuationToken);

	return {
		items: listResult,
	};
};

const _listWithPath = async ({
	s3Config,
	listParams,
}: ListInputArgs): Promise<ListPaginateWithPathOutput> => {
	const listParamsClone = { ...listParams };
	if (!listParamsClone.MaxKeys || listParamsClone.MaxKeys > MAX_PAGE_SIZE) {
		logger.debug(`defaulting pageSize to ${MAX_PAGE_SIZE}.`);
		listParamsClone.MaxKeys = MAX_PAGE_SIZE;
	}

	const response: ListObjectsV2Output = await listObjectsV2(
		{
			...s3Config,
			userAgentValue: getStorageUserAgentValue(StorageAction.List),
		},
		listParamsClone,
	);

	if (!response?.Contents) {
		return {
			items: [],
		};
	}

	return {
		items: response.Contents.map(item => ({
			path: item.Key!,
			eTag: item.ETag,
			lastModified: item.LastModified,
			size: item.Size,
		})),
		nextToken: response.NextContinuationToken,
	};
};
