import {
	MiddlewareContext,
	MiddlewareHandler,
	Request,
	Response,
} from '../types/core';

/**
 * TODO
 */
export interface RetryOptions {
	maxRetries?: number;
	maxDelayMs?: number;
}

export function jitteredBackOffRetry<T extends Request, U extends Response>() {
	return function jitteredBackOffRetry(
		next: MiddlewareHandler<T, U, RetryOptions>,
		context: MiddlewareContext
	) {
		return async function jitteredBackOffRetry(
			request: T,
			options: RetryOptions
		) {
			// TODO: implement jittered exponential back-off retry.
			const response = await next(request, options);
			return response;
		};
	};
}
