import {
	Endpoint,
	HttpRequest,
	HttpResponse,
	parseMetadata,
	composeServiceApi,
} from '@aws-amplify/core/internals/aws-client-utils';
import type {
	ListObjectsV2CommandInput,
	ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';

import { assignSerializableValues, defaultConfig } from './base';
import { parser as xmlParser, parseXmlError, s3TransferHandler } from './utils';

export type ListObjectsV2Input = ListObjectsV2CommandInput;

export type ListObjectsV2Output = ListObjectsV2CommandOutput;

const listObjectsV2Serializer = (
	input: ListObjectsV2Input,
	endpoint: Endpoint
): HttpRequest => {
	const headers = assignSerializableValues({
		'x-amz-request-payer': input.RequestPayer,
		'x-amz-expected-bucket-owner': input.ExpectedBucketOwner,
	});
	const query = assignSerializableValues({
		'list-type': '2',
		'continuation-token': input.ContinuationToken,
		delimiter: input.Delimiter,
		'encoding-type': input.EncodingType,
		'fetch-owner': input.FetchOwner,
		'max-keys': input.MaxKeys,
		prefix: input.Prefix,
		'start-after': input.StartAfter,
	});
	const url = new URL(endpoint.url.toString());
	url.hostname = `${input.Bucket}.${url.hostname}`;
	url.search = new URLSearchParams(query).toString();
	return {
		method: 'GET',
		headers,
		url,
	};
};

const listObjectsV2Deserializer = async (
	response: HttpResponse
): Promise<ListObjectsV2Output> => {
	if (response.statusCode >= 300) {
		const error = await parseXmlError(response);
		throw error;
	} else if (!response?.body) {
		// S3 can return 200 without a body indicating failure.
		throw new Error('S3 aborted request');
	} else {
		const data = await response?.body?.text();
		const parsed = await xmlParser.parse(data ?? '');
		// TODO: convert boolean, number, and timestamp strings to their respective types
		return {
			$metadata: parseMetadata(response),
			...parsed,
		};
	}
};

export const listObjectsV2 = composeServiceApi(
	s3TransferHandler,
	listObjectsV2Serializer,
	listObjectsV2Deserializer,
	{ ...defaultConfig, responseType: 'text' }
);
