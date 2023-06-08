import {
	ErrorParser,
	HttpResponse,
	parseMetadata,
} from '@aws-amplify/core/internals/aws-client-utils';

import { parser } from './xmlParser.browser';

export const parseXmlError: ErrorParser = async (response?: HttpResponse) => {
	if (!response || response.statusCode < 300) {
		return;
	}
	const { statusCode } = response;
	const body = await parseXmlBody(response);
	const code = body?.['Code']
		? (body.Code as string)
		: statusCode === 404
		? 'NotFound'
		: '' + statusCode;
	const message = body?.['message'] ?? body?.['Message'] ?? 'UnknownError';
	const error = new Error(message);
	return Object.assign(error, {
		name: code,
		$metadata: parseMetadata(response),
	});
};

export const parseXmlBody = async (response: HttpResponse): Promise<any> => {
	if (!response.body) {
		throw new Error('Missing response payload');
	}
	const data = await response.body.text();
	if (data?.length > 0) {
		try {
			return parser.parse(data);
		} catch (error) {
			throw new Error('Failed to parse XML response');
		}
	}
	return {};
};
