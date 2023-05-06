import {
	Endpoint,
	HttpRequest,
	HttpResponse,
} from '@aws-amplify/core/lib-esm/clients/types';
import { parseMetadata } from '@aws-amplify/core/lib-esm/clients/serde';
import { composeServiceApi } from '@aws-amplify/core/lib-esm/clients/internal/composeServiceApi';
import type {
	GetObjectCommandInput,
	GetObjectCommandOutput,
} from '@aws-sdk/client-s3';

import { serializeHeaders, defaultConfig } from './base';
import { parseXmlError, s3TransferHandler } from './utils';

export type GetObjectInput = Pick<
	GetObjectCommandInput,
	| 'Bucket'
	| 'Key'
	| 'ResponseCacheControl'
	| 'ResponseContentDisposition'
	| 'ResponseContentEncoding'
	| 'ResponseContentLanguage'
	| 'ResponseContentType'
	| 'SSECustomerAlgorithm'
	| 'SSECustomerKey'
	| 'SSECustomerKeyMD5'
>;

export type GetObjectOutput = GetObjectCommandOutput;

const getObjectSerializer = (
	input: GetObjectInput,
	endpoint: Endpoint
): HttpRequest => {
	const headers = serializeHeaders({
		'x-amz-server-side-encryption-customer-algorithm':
			input.SSECustomerAlgorithm,
		'x-amz-server-side-encryption-customer-key': input.SSECustomerKey,
		'x-amz-server-side-encryption-customer-key-MD5': input.SSECustomerKeyMD5,
	});
	const query = {
		'x-id': 'GetObject',
		// TODO: add other query params
	};
	const url = new URL(endpoint.url);
	url.hostname = `${input.Bucket}.${url.hostname}`;
	url.pathname = `/${input.Key}`;
	url.search = new URLSearchParams(query).toString();
	return {
		method: 'GET',
		headers,
		url,
	};
};

const getObjectDeserializer = async (
	response: HttpResponse
): Promise<GetObjectOutput> => {
	if (response.statusCode >= 300) {
		const error = await parseXmlError(response);
		throw error;
	} else {
		return {
			$metadata: parseMetadata(response),
			Body: await response.body.blob(),
			// TODO: add all other s3 object fields
		};
	}
};

export const getObject = composeServiceApi(
	s3TransferHandler,
	getObjectSerializer,
	getObjectDeserializer,
	{ ...defaultConfig, responseType: 'blob' }
);
