/**
 * General None HTTP-specific request interface
 */
export interface Request {
	destination: URL;
	body: unknown;
}

export interface Response {
	body: unknown;
}

export interface TransferClient<Request, Response, TransferOptions> {
	send: (request: Request, options: TransferOptions) => Promise<Response>;
}

/**
 * A slimmed down version of the AWS SDK v3 middleware handler, only handling instantiated requests
 */
export type MiddlewareHandler<Request, Response, MiddlewareOptions> = (
	request: Request,
	options: MiddlewareOptions
) => Promise<Response>;

export type MiddlewareContext = Record<string, unknown>;

/**
 * A slimmed down version of the AWS SDK v3 middleware, only handling tasks after Serde.
 */
export type Middleware<Request, Response, MiddlewareOptions> = (
	next: MiddlewareHandler<Request, Response, MiddlewareOptions>,
	context: MiddlewareContext
) => MiddlewareHandler<Request, Response, MiddlewareOptions>;

export interface Endpoint {
	url: URL;
}

export type SideEffectReference<T> = { get(): T; set(value: T): void };
