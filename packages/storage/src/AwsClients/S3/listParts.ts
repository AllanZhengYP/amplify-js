import {
	Endpoint,
	HttpRequest,
	HttpResponse,
	parseMetadata,
} from '@aws-amplify/core/internals/aws-client-utils';
import { composeServiceApi } from '@aws-amplify/core/internals/aws-client-utils/composers';
import type {
	ListPartsCommandInput,
	ListPartsCommandOutput,
	CompletedPart,
} from './types';
import { defaultConfig } from './base';
import {
	emptyArrayGuard,
	serializeObjectSsecOptionsToHeaders,
	map,
	parser as xmlParser,
	parseXmlError,
	s3TransferHandler,
	deserializeNumber,
} from './utils';

export type ListPartsInput = Pick<
	ListPartsCommandInput,
	| 'Bucket'
	| 'Key'
	| 'UploadId'
	| 'SSECustomerAlgorithm'
	| 'SSECustomerKey'
	| 'SSECustomerKeyMD5'
>;

export type ListPartsOutput = Pick<
	ListPartsCommandOutput,
	'Parts' | 'UploadId' | '$metadata'
>;

const listPartsSerializer = (
	input: ListPartsInput,
	endpoint: Endpoint
): HttpRequest => {
	const headers = serializeObjectSsecOptionsToHeaders(input);
	const url = new URL(endpoint.url.toString());
	url.hostname = `${input.Bucket}.${url.hostname}`;
	url.pathname = `/${input.Key}`;
	url.search = new URLSearchParams({
		uploadId: input.UploadId,
	}).toString();
	return {
		method: 'GET',
		headers,
		url,
	};
};

const listPartsDeserializer = async (
	response: HttpResponse
): Promise<ListPartsOutput> => {
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
			Parts: [
				'Part',
				value => emptyArrayGuard(value, deserializeCompletedPartList),
			],
		});
		return {
			$metadata: parseMetadata(response),
			...contents,
		};
	}
};

const deserializeCompletedPartList = (input: any[]): CompletedPart[] =>
	input.map(item =>
		map(item, {
			PartNumber: ['PartNumber', deserializeNumber],
			ETag: 'ETag',
		})
	);

export const listParts = composeServiceApi(
	s3TransferHandler,
	listPartsSerializer,
	listPartsDeserializer,
	{ ...defaultConfig, responseType: 'text' }
);
