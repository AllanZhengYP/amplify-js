// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// TODO(ashwinkumar6) this uses V5 Credentials, update to V6.
import { Credentials } from '@aws-sdk/types';

import { TransferProgressEvent } from '../../../types';
import { StorageOptions, StorageReadOptions } from '../../../types/options';

/**
 * Request options type for S3 Storage operations.
 */
type S3Options = StorageOptions & {
	/**
	 * Whether to use accelerate endpoint.
	 * @default false
	 */
	useAccelerateEndpoint?: boolean;
};

type S3ReadOptions = StorageReadOptions & {
	/**
	 * Whether to use accelerate endpoint.
	 * @default false
	 */
	useAccelerateEndpoint?: boolean;
};

/**
 * Request options type for S3 downloadData APIs.
 */
export type S3DownloadDataOptions = S3ReadOptions & {
	/**
	 * Callback function tracking the upload/download progress.
	 */
	onProgress?: (event: TransferProgressEvent) => void;
};

/**
 * Request options type for S3 uploadData APIs.
 */
export type S3UploadDataOptions = S3Options & {
	/**
	 * Callback function tracking the upload/download progress.
	 */
	onProgress?: (event: TransferProgressEvent) => void;
	/**
	 * The default content-disposition header value of the file when downloading it.
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
	 */
	contentDisposition?: string;
	/**
	 * The default content-encoding header value of the file when downloading it.
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
	 */
	contentEncoding?: string;
	/**
	 * The default content-type header value of the file when downloading it.
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
	 */
	contentType?: string;
	/**
	 * The user-defined metadata for the object uploaded to S3.
	 * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMetadata.html#UserMetadata
	 */
	metadata?: Record<string, string>;
};

export type S3GetUrlOptions = S3ReadOptions & {
	/**
	 * Whether to head object to make sure the object existence before downloading.
	 * @default false
	 */
	validateObjectExistence?: boolean;
	/**
	 * Number of seconds till the URL expires.
	 * @default 900 (15 minutes)
	 */
	expiresIn?: number;
};

/**
 * Internal only type for S3 API handlers' config parameter.
 *
 * @internal
 */
export type ResolvedS3Config = {
	region: string;
	credentials: Credentials;
	customEndpoint?: string;
	forcePathStyle?: boolean;
	useAccelerateEndpoint?: boolean;
};
