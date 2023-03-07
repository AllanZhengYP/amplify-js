import { jitteredBackOffRetry, RetryOptions } from './middleware/retry';
import { sigV4Auth, SigV4AuthOptions } from './middleware/auth/sigv4';
import { composeTransferClient } from './internal/client';
import { fetchTransferClient } from './protocol/fetch';
import { HttpRequest, HttpResponse, HttpTransferOptions } from './types/http';

export const awsTransferClient = composeTransferClient<
	HttpRequest,
	HttpResponse,
	HttpTransferOptions,
	[RetryOptions, SigV4AuthOptions]
>(fetchTransferClient, [
	jitteredBackOffRetry<HttpRequest, HttpResponse>(),
	sigV4Auth,
]);
