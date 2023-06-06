import { HttpResponse } from '@aws-amplify/core/internals/aws-client-utils';
import { fetchTransferHandler } from '@aws-amplify/core/lib/clients/handlers/fetch';

import cases from './cases';

jest.mock('@aws-amplify/core/lib/clients/handlers/fetch');

const mockBinaryResponse = ({
	status,
	headers,
	body,
}: {
	status: number;
	headers: Record<string, string>;
	body: string;
}): HttpResponse => {
	const responseBody = {
		json: async () => `JSON format of body ${body}`,
		blob: async () => `Blob format of body ${body}` as unknown as Blob,
		text: async () => `text format of body ${body}`,
	} as HttpResponse['body'];
	return {
		statusCode: status,
		headers,
		body: responseBody,
	};
};

describe('S3 APIs functional test', () => {
	beforeEach(() => {
		(fetchTransferHandler as jest.Mock).mockReset();
	});
	test.each(cases)(
		'%s %s',
		async (
			caseType,
			name,
			handler,
			config,
			input,
			expectedRequest,
			response,
			outputOrError
		) => {
			expect.assertions(caseType === 'happy case' ? 2 : 1);
			(fetchTransferHandler as jest.Mock).mockResolvedValue(
				mockBinaryResponse(response as any)
			);
			try {
				const output = await handler(config, input);
				if (caseType === 'happy case') {
					expect(output).toEqual(outputOrError);
					expect(fetchTransferHandler).toBeCalledWith(
						expectedRequest,
						expect.anything()
					);
				} else {
					fail(`${name} ${caseType} should fail`);
				}
			} catch (e) {
				if (caseType === 'happy case') {
					fail(`${name} ${caseType} should succeed`);
				} else {
					expect(e).toEqual(outputOrError);
				}
			}
		}
	);
});
