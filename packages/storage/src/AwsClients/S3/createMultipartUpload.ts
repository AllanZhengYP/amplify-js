import {
	Endpoint,
	HttpRequest,
	HttpResponse,
	parseMetadata,
} from '@aws-amplify/core/internals/aws-client-utils';
import { composeServiceApi } from '@aws-amplify/core/internals/aws-client-utils/composers';
import type {
	CreateMultipartUploadCommandInput,
	CreateMultipartUploadCommandOutput,
} from './types';
import type { PutObjectInput } from './putObject';

import { defaultConfig } from './base';
import {
	map,
	parser as xmlParser,
	parseXmlError,
	s3TransferHandler,
	serializeObjectConfigsToHeaders,
} from './utils';

export type CreateMultipartUploadInput = Extract<
	CreateMultipartUploadCommandInput,
	PutObjectInput
>;

export type CreateMultipartUploadOutput = Pick<
	CreateMultipartUploadCommandOutput,
	'UploadId' | '$metadata'
>;

const createMultipartUploadSerializer = (
	input: CreateMultipartUploadInput,
	endpoint: Endpoint
): HttpRequest => {
	const headers = serializeObjectConfigsToHeaders(input);
	const url = new URL(endpoint.url.toString());
	url.hostname = `${input.Bucket}.${url.hostname}`;
	url.pathname = `/${input.Key}`;
	url.search = 'uploads';
	return {
		method: 'POST',
		headers,
		url,
	};
};

const createMultipartUploadDeserializer = async (
	response: HttpResponse
): Promise<CreateMultipartUploadOutput> => {
	if (response.statusCode >= 300) {
		const error = await parseXmlError(response);
		throw error;
	} else if (!response?.body) {
		// S3 can return 200 without a body indicating failure.
		throw new Error('S3 aborted request');
	} else {
		const data = await response?.body?.text();
		const parsed = await xmlParser.parse(data ?? '');
		const contents = map(parsed, {
			UploadId: 'UploadId',
		});
		return {
			$metadata: parseMetadata(response),
			...contents,
		};
	}
};

export const createMultipartUpload = composeServiceApi(
	s3TransferHandler,
	createMultipartUploadSerializer,
	createMultipartUploadDeserializer,
	{ ...defaultConfig, responseType: 'text' }
);
