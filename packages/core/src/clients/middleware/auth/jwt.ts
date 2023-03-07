import { Middleware } from '../../types/core';
import { HttpRequest, HttpResponse } from '../../types/http';

/**
 * TODO
 */
export interface JwtAuthOptions {
	jwtProvider: () => Promise<string>;
}

export const jwtAuth: Middleware<HttpRequest, HttpResponse, JwtAuthOptions> = (
	next,
	context
) =>
	async function jwtAuth(request, options) {
		/**
		 * TODO: implement jwt auth
		 */
		return next(request, options);
	};
