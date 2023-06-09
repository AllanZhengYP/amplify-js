import {
	Endpoint,
	HttpRequest,
	HttpResponse,
	parseMetadata,
} from '@aws-amplify/core/internals/aws-client-utils';
import { composeServiceApi } from '@aws-amplify/core/internals/aws-client-utils/composers';

import { defaultConfig } from './base';
import type { PutObjectCommandInput, PutObjectCommandOutput } from './types';
import {
	assignSerializableValues,
	map,
	parseXmlError,
	s3TransferHandler,
} from './utils';
import type { S3ProviderPutConfig } from '../../types';

/**
 * Reference: {@link S3ProviderPutConfig}
 */
export type PutObjectInput = Pick<
	PutObjectCommandInput,
	| 'Bucket'
	| 'Key'
	| 'Body'
	| 'ServerSideEncryption'
	| 'SSECustomerAlgorithm'
	| 'SSECustomerKey'
	| 'SSECustomerKeyMD5'
	| 'SSEKMSKeyId'
	| 'ACL'
	| 'CacheControl'
	| 'ContentDisposition'
	| 'ContentEncoding'
	| 'ContentType'
	| 'Expires'
	| 'Metadata'
	| 'Tagging'
>;

export type PutObjectOutput = Pick<
	PutObjectCommandOutput,
	// PutObject output is not exposed in public API, but only logged in the debug mode
	// so we only expose $metadata, ETag and VersionId for debug purpose.
	'$metadata' | 'ETag' | 'VersionId'
>;

const putObjectSerializer = (
	input: PutObjectInput,
	endpoint: Endpoint
): HttpRequest => {
	const headers = assignSerializableValues({
		'x-amz-server-side-encryption': input.ServerSideEncryption,
		'x-amz-server-side-encryption-customer-algorithm':
			input.SSECustomerAlgorithm,
		'x-amz-server-side-encryption-customer-key': input.SSECustomerKey,
		'x-amz-server-side-encryption-customer-key-md5': input.SSECustomerKeyMD5,
		'x-amz-server-side-encryption-aws-kms-key-id': input.SSEKMSKeyId,
		'x-amz-acl': input.ACL,
		'cache-control': input.CacheControl,
		'content-disposition': input.ContentDisposition,
		'content-encoding': input.ContentEncoding,
		'content-type': input.ContentType,
		expires: input.Expires?.toUTCString(),
		'x-amz-tagging': input.Tagging,
		...serializeMetadata(input.Metadata),
	});
	const url = new URL(endpoint.url.toString());
	url.hostname = `${input.Bucket}.${url.hostname}`;
	url.pathname = `/${input.Key}`;
	return {
		method: 'PUT',
		headers,
		url,
		body: input.Body,
	};
};

const serializeMetadata = (
	metadata: Record<string, string> = {}
): Record<string, string> =>
	Object.keys(metadata).reduce((acc: any, suffix: string) => {
		acc[`x-amz-meta-${suffix.toLowerCase()}`] = metadata[suffix];
		return acc;
	}, {});

const putObjectDeserializer = async (
	response: HttpResponse
): Promise<PutObjectOutput> => {
	if (response.statusCode >= 300) {
		const error = await parseXmlError(response);
		throw error;
	} else {
		return {
			...map(response.headers, {
				ETag: 'etag',
				VersionId: 'x-amz-version-id',
			}),
			$metadata: parseMetadata(response),
		};
	}
};

export const putObject = composeServiceApi(
	s3TransferHandler,
	putObjectSerializer,
	putObjectDeserializer,
	{ ...defaultConfig, responseType: 'text' }
);
