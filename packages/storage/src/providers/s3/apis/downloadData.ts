// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AmplifyV6 } from '@aws-amplify/core';
import { StorageDownloadDataParameter, DownloadTask } from '../../../types';
import { S3TransferOptions, S3DownloadDataResult } from '../types';
import { assertValidationError } from '../../../errors/assertValidationErrors';
import { StorageValidationErrorCode } from '../../../errors/types/validation';
import { createTransferTask } from '../../../utils/transferTask';
import { getObject } from '../../../AwsClients/S3/getObject';
import { prefixResolver as defaultPrefixResolver } from '../../../utils/prefixResolver';

// TODO: pending implementation
export const downloadData = (
	params: StorageDownloadDataParameter<S3TransferOptions>
): DownloadTask<S3DownloadDataResult> => {
	const controller = new AbortController();
	const job = async (): Promise<S3DownloadDataResult> => {
		const { awsCreds, awsCredsIdentityId } =
			await AmplifyV6.Auth.fetchAuthSession();
		assertValidationError(!!awsCreds, StorageValidationErrorCode.NoCredentials);
		const { bucket, region, defaultAccessLevel } =
			AmplifyV6.getConfig().Storage;
		// TODO: assert bucket and region;
		const { prefixResolver = defaultPrefixResolver } =
			AmplifyV6.libraryOptions?.Storage ?? {};
		const {
			key,
			options: {
				useAccelerateEndpoint,
				level = defaultAccessLevel,
				onProgress,
			} = {},
		} = params;
		const onDownloadProgress = onProgress
			? event => {
					onProgress({
						transferred: event.loaded,
						total: result.ContentLength,
						target: downloadTask,
					});
			  }
			: undefined;

		const result = await getObject(
			{
				credentials: awsCreds,
				region,
				abortSignal: controller.signal,
				onDownloadProgress,
				useAccelerateEndpoint,
			},
			{
				Bucket: bucket,
				Key:
					(await prefixResolver({
						level,
						identityId: awsCredsIdentityId,
					})) + key,
			}
		);
		return {
			body: result.Body,
			lastModified: result.LastModified,
			contentLength: result.ContentLength,
			eTag: result.ETag,
			metadata: result.Metadata,
		};
	};
	const downloadTask = createTransferTask({
		job,
		onCancel: () => {
			controller.abort();
		},
		onPause: () => {}, // TODO: create no-op function
		onResume: () => {}, // TODO: create no-op function
	});
	return downloadTask;
};
