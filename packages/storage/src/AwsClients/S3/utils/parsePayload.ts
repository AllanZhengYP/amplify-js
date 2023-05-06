import {
	ErrorParser,
	HttpResponse,
} from '@aws-amplify/core/lib-esm/clients/types';

import { parser } from './xmlParser.browser';
import { parseMetadata } from '@aws-amplify/core/lib-esm/clients/serde';

export const parseXmlError: ErrorParser = async (response?: HttpResponse) => {
	if (!response || response.statusCode < 300) {
		return;
	}
	const { statusCode } = response;
	let body: unknown;
	try {
		body = await parseXmlBody(response);
	} catch (error) {
		// TODO
		throw error;
	}
	const code =
		statusCode === 404
			? 'NotFound'
			: (body?.['Code'] as string) || statusCode.toString();
	const sanitizedCode = code.includes('#') ? code.split('#')[1] : code;
	const message = body?.['message'] ?? body?.['Message'] ?? 'UnknownError';
	const error = new Error(message);
	return Object.assign(error, {
		name: sanitizedCode,
		$metadata: parseMetadata(response),
	});
};

export const parseXmlBody = async (response: HttpResponse): Promise<any> => {
	if (!response.body) {
		throw new Error('Missing response payload');
	}
	const data = await response.body.text();
	if (data?.length > 0) {
		return parser.parse(data);
	}
	return {};
};
