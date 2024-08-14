// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export { SERVICE_NAME } from './base';
import { StreamingBlobPayloadOutputTypes } from '@smithy/types';
import { S3Client } from '@aws-sdk/client-s3';

const translateStream = (payload: StreamingBlobPayloadOutputTypes) => ({
	blob: () => payload.transformToByteArray().then(buffer => new Blob([buffer])),
	json: () => payload.transformToString().then(text => JSON.parse(text)),
	text: () => payload.transformToString(),
}) as ResponseBodyMixin & Blob; // Blob is missing but the library is not using them anyway.

import type {
	getObject,
	GetObjectInput,
	GetObjectOutput,
	getPresignedGetObjectUrl,
} from './getObject';
import { GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';
const sdk_getObject: typeof getObject = async (config, input) => {
	const client = new S3Client(config);
	const command = new GetObjectCommand(input);
	const response = await client.send(command);
	return {
		...response,
		Body: translateStream(response.Body!),
	};
}
import type {
	listObjectsV2,
	ListObjectsV2Input,
	ListObjectsV2Output,
} from './listObjectsV2';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
const sdk_listObjectsV2: typeof listObjectsV2 = async (config, input) => {
	const client = new S3Client(config);
	const command = new ListObjectsV2Command(input);
	const response = await client.send(command);
	return response;
}

import type { putObject, PutObjectInput, PutObjectOutput } from './putObject';
import { PutObjectCommand } from '@aws-sdk/client-s3';
const sdk_putObject: typeof putObject = async (config, input) => {
	const client = new S3Client(config);
	const command = new PutObjectCommand(input as any);
	const response = await client.send(command);
	return response;
}
import type {
	createMultipartUpload,
	CreateMultipartUploadInput,
	CreateMultipartUploadOutput,
} from './createMultipartUpload';
import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
const sdk_createMultipartUpload: typeof createMultipartUpload = async (
	config,
	input
) => {
	const client = new S3Client(config);
	const command = new CreateMultipartUploadCommand(input);
	const response = await client.send(command);
	return response;
}
import type { uploadPart, UploadPartInput, UploadPartOutput } from './uploadPart';
import type {
	completeMultipartUpload,
	CompleteMultipartUploadInput,
	CompleteMultipartUploadOutput,
} from './completeMultipartUpload';
import type { listParts, ListPartsInput, ListPartsOutput } from './listParts';
import type {
	abortMultipartUpload,
	AbortMultipartUploadInput,
	AbortMultipartUploadOutput,
} from './abortMultipartUpload';
import type { copyObject, CopyObjectInput, CopyObjectOutput } from './copyObject';
import type { headObject, HeadObjectInput, HeadObjectOutput } from './headObject';
import type {
	deleteObject,
	DeleteObjectInput,
	DeleteObjectOutput,
} from './deleteObject';
import type { CompletedPart, Part, _Object } from './types';
import { ResponseBodyMixin } from '@aws-amplify/core/internals/aws-client-utils';
import { text } from 'stream/consumers';

