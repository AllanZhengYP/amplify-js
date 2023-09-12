// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
	StorageOptions,
	StorageReadOptions,
	StorageUploadSourceOptions,
	StorageListAllOptions,
	StorageListPaginateOptions,
	StorageCopySourceOptions,
	StorageCopyDestinationOptions,
} from './options';

export type StorageOperationRequest<Options extends StorageOptions> = {
	key: string;
	options?: Options;
};

export type StorageListRequest<
	Options extends StorageListAllOptions | StorageListPaginateOptions
> = {
	path?: string;
	options?: Options;
};

export type StorageDownloadDataRequest<Options extends StorageReadOptions> =
	StorageOperationRequest<Options>;

export type StorageUploadDataRequest<Options extends StorageOptions> =
	StorageOperationRequest<Options> & {
		data: StorageUploadSourceOptions;
	};

export type CopyRequest = {
	source: StorageCopySourceOptions;
	destination: StorageCopyDestinationOptions;
};
