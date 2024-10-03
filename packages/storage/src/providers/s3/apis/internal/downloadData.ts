// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Amplify } from '@aws-amplify/core';
import { StorageAction } from '@aws-amplify/core/internals/utils';

import {
	DownloadDataInput,
	DownloadDataOutput,
	DownloadDataWithPathInput,
	DownloadDataWithPathOutput,
} from '../../types';
import { resolveS3ConfigAndInput } from '../../utils/resolveS3ConfigAndInput';
import { createDownloadTask, validateStorageOperationInput } from '../../utils';
import { getObject } from '../../utils/client/s3data';
import { getStorageUserAgentValue } from '../../utils/userAgent';
import { logger } from '../../../../utils';
import {
	StorageDownloadDataOutput,
	StorageItemWithKey,
	StorageItemWithPath,
} from '../../../../types';
import { STORAGE_INPUT_KEY } from '../../utils/constants';
import { resolveIdentityId } from '../../utils/resolveIdentityId';

export const downloadData = async (
	input: DownloadDataInput | DownloadDataWithPathInput,
): Promise<DownloadDataOutput | DownloadDataWithPathOutput> => {
	const abortController = new AbortController();

	const { identityId } = await resolveS3ConfigAndInput(Amplify, input);
	const { inputType } = validateStorageOperationInput(input, identityId);

	if (inputType === STORAGE_INPUT_KEY) {
		input;
		return createDownloadTask({
			job: downloadDataJobWithKey(
				input as DownloadDataInput,
				abortController.signal,
			),
			onCancel: (message?: string) => {
				abortController.abort(message);
			},
		});
	} else {
		return createDownloadTask({
			job: downloadDataJobWithPath(
				input as DownloadDataWithPathInput,
				abortController.signal,
			),
			onCancel: (message?: string) => {
				abortController.abort(message);
			},
		});
	}
};

const downloadDataJobWithPath =
	(downloadDataInput: DownloadDataWithPathInput, abortSignal: AbortSignal) =>
	async (): Promise<StorageDownloadDataOutput<StorageItemWithPath>> => {
		const { options: downloadDataOptions, path } = downloadDataInput;
		const { bucket, s3Config, identityId } = await resolveS3ConfigAndInput(
			Amplify,
			downloadDataInput,
		);

		const finalKey =
			typeof path === 'string'
				? path
				: path({ identityId: resolveIdentityId(identityId) });
		logger.debug(`download ${finalKey}.`);

		const {
			Body: body,
			LastModified: lastModified,
			ContentLength: size,
			ETag: eTag,
			Metadata: metadata,
			VersionId: versionId,
			ContentType: contentType,
		} = await getObject(
			{
				...s3Config,
				abortSignal,
				onDownloadProgress: downloadDataOptions?.onProgress,
				userAgentValue: getStorageUserAgentValue(StorageAction.DownloadData),
			},
			{
				Bucket: bucket,
				Key: finalKey,
				...(downloadDataOptions?.bytesRange && {
					Range: `bytes=${downloadDataOptions.bytesRange.start}-${downloadDataOptions.bytesRange.end}`,
				}),
			},
		);

		const result = {
			body,
			lastModified,
			size,
			contentType,
			eTag,
			metadata,
			versionId,
		};

		return { path: finalKey, ...result };
	};

const downloadDataJobWithKey =
	(downloadDataInput: DownloadDataInput, abortSignal: AbortSignal) =>
	async (): Promise<StorageDownloadDataOutput<StorageItemWithKey>> => {
		const { options: downloadDataOptions, key } = downloadDataInput;
		const { bucket, keyPrefix, s3Config } = await resolveS3ConfigAndInput(
			Amplify,
			downloadDataInput,
		);

		const finalKey = keyPrefix + key;
		logger.debug(`download ${finalKey}.`);

		const {
			Body: body,
			LastModified: lastModified,
			ContentLength: size,
			ETag: eTag,
			Metadata: metadata,
			VersionId: versionId,
			ContentType: contentType,
		} = await getObject(
			{
				...s3Config,
				abortSignal,
				onDownloadProgress: downloadDataOptions?.onProgress,
				userAgentValue: getStorageUserAgentValue(StorageAction.DownloadData),
			},
			{
				Bucket: bucket,
				Key: finalKey,
				...(downloadDataOptions?.bytesRange && {
					Range: `bytes=${downloadDataOptions.bytesRange.start}-${downloadDataOptions.bytesRange.end}`,
				}),
			},
		);

		const result = {
			body,
			lastModified,
			size,
			contentType,
			eTag,
			metadata,
			versionId,
		};

		return { key, ...result };
	};

// const downloadDataJobOld =
// 	(
// 		downloadDataInput: DownloadDataInput | DownloadDataWithPathInput,
// 		abortSignal: AbortSignal,
// 	) =>
// 	async (): Promise<
// 		StorageDownloadDataOutput<StorageItemWithKey | StorageItemWithPath>
// 	> => {
// 		const { options: downloadDataOptions } = downloadDataInput;
// 		const { bucket, keyPrefix, s3Config, identityId } =
// 			await resolveS3ConfigAndInput(Amplify, downloadDataInput);
// 		const { inputType, objectKey } = validateStorageOperationInput(
// 			downloadDataInput,
// 			identityId,
// 		);
// 		const finalKey =
// 			inputType === STORAGE_INPUT_KEY ? keyPrefix + objectKey : objectKey;

// 		logger.debug(`download ${objectKey} from ${finalKey}.`);

// 		const {
// 			Body: body,
// 			LastModified: lastModified,
// 			ContentLength: size,
// 			ETag: eTag,
// 			Metadata: metadata,
// 			VersionId: versionId,
// 			ContentType: contentType,
// 		} = await getObject(
// 			{
// 				...s3Config,
// 				abortSignal,
// 				onDownloadProgress: downloadDataOptions?.onProgress,
// 				userAgentValue: getStorageUserAgentValue(StorageAction.DownloadData),
// 			},
// 			{
// 				Bucket: bucket,
// 				Key: finalKey,
// 				...(downloadDataOptions?.bytesRange && {
// 					Range: `bytes=${downloadDataOptions.bytesRange.start}-${downloadDataOptions.bytesRange.end}`,
// 				}),
// 			},
// 		);

// 		const result = {
// 			body,
// 			lastModified,
// 			size,
// 			contentType,
// 			eTag,
// 			metadata,
// 			versionId,
// 		};

// 		return inputType === STORAGE_INPUT_KEY
// 			? { key: objectKey, ...result }
// 			: { path: objectKey, ...result };
// 	};
