import { ServiceClientOptions } from '../types/aws';
import {
	Middleware,
	MiddlewareHandler,
	TransferClient,
	Request as RequestBase,
	Response as ResponseBase,
	Endpoint,
} from '../types/core';

type OptionToMiddleware<
	Request,
	Response,
	Options extends any[]
> = Options extends [infer LastOption]
	? [Middleware<Request, Response, LastOption>]
	: Options extends [infer FirstOption, ...infer RestOptions]
	? [
			Middleware<Request, Response, FirstOption>,
			...OptionToMiddleware<Request, Response, RestOptions>
	  ]
	: never;

type EnsureNoConflictKeys<T, U> = Pick<U, keyof T & keyof U> extends Pick<
	T,
	keyof T & keyof U
>
	? true
	: false;
type MergeTwoNoConflictKeys<T, U> = EnsureNoConflictKeys<T, U> extends true
	? T & U
	: never;
type MergeNoConflictKeys<Options extends any[]> = Options extends [
	infer OnlyOption
]
	? OnlyOption
	: Options extends [infer FirstOption, infer SecondOption]
	? MergeTwoNoConflictKeys<FirstOption, SecondOption>
	: Options extends [infer FirstOption, ...infer RestOptions]
	? MergeTwoNoConflictKeys<FirstOption, MergeNoConflictKeys<RestOptions>>
	: never;

export const composeTransferClient = <
	Request extends RequestBase,
	Response extends ResponseBase,
	TransferOptions,
	MiddlewareOptionsArr extends any[]
>(
	coreClient: TransferClient<Request, Response, TransferOptions>,
	middleware: OptionToMiddleware<Request, Response, MiddlewareOptionsArr>
) => {
	return {
		send: (
			request: Request,
			options: MergeNoConflictKeys<[...MiddlewareOptionsArr, TransferOptions]>
		) => {
			let composedHandler = coreClient.send as unknown as MiddlewareHandler<
				Request,
				Response,
				MiddlewareOptionsArr[number]
			>;
			for (const m of middleware.reverse()) {
				composedHandler = m(composedHandler, {});
			}
			return composedHandler(request, options);
		},
	};
};

export const composeServiceApi =
	<
		Input,
		Output,
		Request extends RequestBase,
		Response extends ResponseBase,
		ServiceContext
	>(
		transferClient: TransferClient<Request, Response, ServiceContext>,
		serializer: (input: Input, endpoint: Endpoint) => Promise<Request>,
		deserializer: (output: Response) => Promise<Output>
	) =>
	async (context: ServiceContext & ServiceClientOptions, input: Input) => {
		const endpoint = await context.endpointProvider();
		const request = await serializer(input, endpoint);
		const response = await transferClient.send(request, context);
		return await deserializer(response);
	};
