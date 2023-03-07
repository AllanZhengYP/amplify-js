import { Middleware } from '../../types/core';
import { HttpRequest, HttpResponse } from '../../types/http';

/**
 * TODO
 */
export interface ApiKeyAuthOptions {
	apiKeyProvider: () => Promise<string>;
}

export const apiKeyAuth: Middleware<
	HttpRequest,
	HttpResponse,
	ApiKeyAuthOptions
> = (next, context) =>
	async function apiKeyAuth(request, options) {
		/**
		 * TODO: implement api key auth
		 */
		return next(request, options);
	};
