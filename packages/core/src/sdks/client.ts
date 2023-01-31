import { HttpRequest, HttpResponse } from '@aws-sdk/types';
import { formatUrl } from '@aws-sdk/util-format-url/dist/es';
import { buildQueryString } from '@aws-sdk/querystring-builder';

import { Signer } from '../Signer';
import {
	Machine,
	MachineContext,
	MachineEvent,
} from '@aws-amplify/auth/lib-esm/stateMachine';

type ClientStates =
	| 'idle'
	| 'configuring'
	| 'serializing'
	| 'building'
	| 'signing'
	| 'sending'
	| 'deserializing'
	| 'error'
	| 'done';

type ClientContext = {
	credentials?: {
		access_key: string;
		secret_key: string;
		session_token: string;
	};
	region?: string;
	endpoint?: URL;
	params?: any;
	error?: Error;
	retryCount?: number;
	request?: HttpRequest;
	response?: HttpResponse;
	result?: any;
};

type Credentials = {
	access_key: string;
	secret_key: string;
	session_token: string;
};

type InputEvent = {
	name: 'input';
	payload: {
		params: any;
		region: string;
		credentials: Credentials;
	};
};

type ErrorEvent = {
	name: 'error';
};

type RequestEvent = {
	name: 'request';
};

type RetryEvent = {
	name: 'retry';
};

type ResponseEvent = {
	name: 'response';
};

type ResultEvent = {
	name: 'result';
};

type ClientEvents =
	| InputEvent
	| RequestEvent
	| RetryEvent
	| ResponseEvent
	| ResultEvent
	| ErrorEvent;

const transition = <
	ContextType extends MachineContext,
	InputEvent extends MachineEvent,
	NextEvent extends MachineEvent,
	StateNames extends string
>(
	toState: StateNames,
	reducers?: [(context: ContextType, event: InputEvent) => ContextType],
	nextEvent?: NextEvent['name'],
	sideEffects?: [
		(
			context: ContextType,
			event: InputEvent
		) => Promise<void | Partial<ContextType>>
	]
) => ({
	nextState: toState,
	reducers: reducers ? reducers : [],
	effects: [
		...(sideEffects?.map(sideEffect => async (ctxt, event) => {
			return await sideEffect(ctxt, event);
		}) ?? []),
		async (ctxt, event, broker) => {
			broker.dispatch({ name: nextEvent ?? event.name });
		},
	],
});

export const baseClient =
	(name, signingName, resolveEndpoints) =>
	async (
		[serialize, deserialize],
		{
			params,
			region,
			credentials,
		}: { params: any; region: string; credentials: Credentials }
	) => {
		return new Promise(async (resolve, reject) => {
			const machine = new Machine<ClientContext, ClientEvents, ClientStates>({
				name,
				initial: 'idle',
				context: {},
				states: {
					idle: {
						input: [
							transition<ClientContext, InputEvent, InputEvent, ClientStates>(
								'configuring',
								[(ctxt, event) => ({ ...ctxt, ...event.payload })] // set params and region to context
							),
						],
					},
					configuring: {
						input: [
							transition<ClientContext, InputEvent, InputEvent, ClientStates>(
								'serializing',
								[
									ctxt => ({
										...ctxt,
										endpoint: resolveEndpoints(ctxt.region!),
									}),
								]
							),
						],
					},
					serializing: {
						input: [
							transition<ClientContext, InputEvent, RequestEvent, ClientStates>(
								'building',
								undefined,
								'request',
								[
									async ctxt => {
										return {
											...ctxt,
											request: await serialize(ctxt.params, {
												endpoint: async () => ctxt.endpoint,
											}),
										};
									},
								]
							),
						],
					},
					building: {
						request: [
							transition<
								ClientContext,
								RequestEvent,
								RequestEvent,
								ClientStates
							>('signing', undefined, 'request', [
								async ctxt => {
									ctxt.request!.headers['content-length'] =
										'' + ctxt.request?.body.length;
									return { ...ctxt };
								},
							]),
						],
						retry: [
							transition<ClientContext, RetryEvent, RequestEvent, ClientStates>(
								'signing',
								undefined,
								'request'
							),
						],
					},
					signing: {
						request: [
							transition<
								ClientContext,
								RequestEvent,
								RequestEvent,
								ClientStates
							>('sending', undefined, 'request', [
								async ctxt => {
									const request = ctxt.request!;
									const body = request.body;
									console.log('params', ctxt.params);
									console.log('before sign', request);

									const signed = Signer.sign(
										{
											...request,
											data: body,
											host: request.hostname,
											url: formatUrl(request),
											query: buildQueryString(request.query ?? {}),
											pathname: request.path,
										},
										ctxt.credentials,
										{
											service: signingName,
											region: ctxt.region,
										} as any
									);
									console.log('signed', signed);
									return {
										...ctxt,
										request: signed,
									};
								},
							]),
						],
					},
					sending: {
						request: [
							{
								nextState: 'sending' as const, //self transit waiting for sending error
								effects: [
									// @ts-ignore
									async (ctxt, event, broker) => {
										try {
											const { method, headers } = ctxt.request!;
											// @ts-ignore
											const resp = await fetch(formatUrl(ctxt.request), {
												method,
												headers,
												body: ctxt.request?.body,
											});
											// mock next tick;
											setTimeout(
												() =>
													broker.dispatch({
														name: 'response',
													} as ResponseEvent),
												0
											);
											// @ts-ignore Compatible with AWS SDK interface.
											resp.statusCode = resp.status;
											return { response: resp };
										} catch (error) {
											setTimeout(
												() =>
													broker.dispatch({
														name: 'error',
													} as ErrorEvent),
												0
											);
											return { error };
										}
									},
								],
							},
						],
						error: [
							transition<ClientContext, ErrorEvent, ErrorEvent, ClientStates>(
								'error'
							),
						],
						response: [
							transition<
								ClientContext,
								ResponseEvent,
								ResponseEvent,
								ClientStates
							>('deserializing'),
						],
					},
					deserializing: {
						response: [
							{
								nextState: 'deserializing',
								effects: [
									async (ctxt, event, broker) => {
										try {
											// @ts-ignore
											const res = await deserialize(ctxt.response, {
												streamCollector: body => new Response(body).text(),
												utf8Encoder: body => {
													return body;
												},
											});
											// @ts-ignore
											// mock next tick;
											setTimeout(() => broker.dispatch({ name: 'result' }), 0);
											return { result: res };
										} catch (error) {
											// mock next tick;
											setTimeout(() => broker.dispatch({ name: 'error' }), 0);
											return { error };
										}
									},
								],
							},
						],
						error: [
							transition<ClientContext, ErrorEvent, ErrorEvent, ClientStates>(
								'error'
							),
						],
						result: [
							transition<ClientContext, ResultEvent, ResultEvent, ClientStates>(
								'done'
							),
						],
					},
					error: {
						error: [
							{
								guards: [(ctxt, event) => ctxt?.retryCount === 3],
								...transition<
									ClientContext,
									ErrorEvent,
									ErrorEvent,
									ClientStates
								>('done'),
							},
							{
								guards: [(ctxt, event) => (ctxt?.retryCount ?? 0) < 3],
								...transition<
									ClientContext,
									ErrorEvent,
									RetryEvent,
									ClientStates
								>('building', [
									ctxt => ({
										...ctxt,
										retryCount: (ctxt?.retryCount ?? 0) + 1,
									}),
								]),
							},
						],
					},
					done: {
						error: [
							transition<ClientContext, ErrorEvent, any, ClientStates>(
								'done',
								undefined,
								'idle',
								[
									async ctxt => {
										reject(ctxt.error);
									},
								]
							),
						],
						result: [
							transition<ClientContext, any, any, ClientStates>(
								'done',
								undefined,
								'idle',
								[
									async ctxt => {
										resolve(ctxt.result);
									},
								]
							),
						],
					},
				},
			});
			machine.addListener({
				dispatch: event => {
					// TODO: next tick
					setTimeout(() => machine.accept(event as any), 0);
				},
			});
			machine.accept({
				name: 'input',
				payload: {
					params,
					region,
					credentials,
				},
			});
		});
	};
