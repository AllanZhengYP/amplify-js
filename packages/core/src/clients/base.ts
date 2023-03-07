import { jitteredBackOffRetry, RetryOptions } from './middleware/retry';
import { composeTransferClient } from './internal/client';
import { fetchTransferClient } from './protocol/fetch';
import { HttpRequest, HttpResponse, HttpTransferOptions } from './types/http';

export const httpClient = composeTransferClient<
	HttpRequest,
	HttpResponse,
	HttpTransferOptions,
	[RetryOptions]
>(fetchTransferClient, [jitteredBackOffRetry()]);
