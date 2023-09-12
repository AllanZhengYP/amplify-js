// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StorageAccessLevel } from '@aws-amplify/core';

export type StorageOptions = { accessLevel?: StorageAccessLevel };

export type StorageReadOptions =
	| { accessLevel?: 'guest' | 'private' }
	| {
			accessLevel: 'protected';
			targetIdentityId?: string;
	  };
/**
 * The data payload type for upload operation.
 */
export type StorageUploadSourceOptions = Blob | BufferSource | string | File;

export type StorageListAllOptions = StorageReadOptions & {
	listAll: true;
};

export type StorageListPaginateOptions = StorageReadOptions & {
	listAll?: false;
	pageSize?: number;
	nextToken?: string;
};

export type StorageRemoveOptions = Omit<StorageOptions, 'targetIdentityId'>;

export type StorageCopySourceOptions = {
	key: string;
} & StorageReadOptions;

export type StorageCopyDestinationOptions = {
	key: string;
} & StorageOptions;
