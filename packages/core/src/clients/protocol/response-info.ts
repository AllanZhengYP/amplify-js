import { HttpResponse } from '../types/http';

export const parseMetadata = (response: HttpResponse) => ({
	httpStatusCode: response.statusCode,
	requestId:
		response.headers.get('x-amzn-requestid') ??
		response.headers.get('x-amzn-request-id') ??
		response.headers.get('x-amz-request-id'),
	extendedRequestId: response.headers.get('x-amz-id-2'),
	cfId: response.headers.get('x-amz-cf-id'),
});
