import {
	HttpRequest,
	TransferHandler,
	ResponseBodyMixin,
} from '@aws-amplify/core/internals/aws-client-utils';
import { ConsoleLogger as Logger } from '@aws-amplify/core';
import type * as events from 'events';

import { CompatibleHttpResponse } from '../types';

export const SEND_UPLOAD_PROGRESS_EVENT = 'sendUploadProgress';
export const SEND_DOWNLOAD_PROGRESS_EVENT = 'sendDownloadProgress';

const NETWORK_ERROR_MESSAGE = 'Network Error';
const NETWORK_ERROR_CODE = 'ECONNABORTED';

const ABORT_ERROR_MESSAGE = 'Request aborted';
const ABORT_ERROR_CODE = 'ERR_ABORTED';

const CANCELED_ERROR_MESSAGE = 'canceled';
const CANCELED_ERROR_CODE = 'ERR_CANCELED';

const logger = new Logger('xhr-http-handler');

/**
 * @internal
 */
export interface XhrTransferHandlerOptions {
	// Expected response body type. If `blob`, the response will be returned as a Blob object. It's mainly used to
	// download binary data. Otherwise, use `text` to return the response as a string.
	responseType: 'text' | 'blob';
	abortSignal?: AbortSignal;
	emitter?: events.EventEmitter;
}

/**
 * Base transfer handler implementation using XMLHttpRequest to support upload and download progress events.
 *
 * @param request - The request object.
 * @param options - The request options.
 * @returns A promise that will be resolved with the response object.
 *
 * @internal
 */
export const xhrTransferHandler: TransferHandler<
	HttpRequest,
	CompatibleHttpResponse,
	XhrTransferHandlerOptions
> = (request, options): Promise<CompatibleHttpResponse> => {
	const { url, method, headers, body } = request;
	const { emitter, responseType, abortSignal } = options;

	return new Promise((resolve, reject) => {
		let xhr: XMLHttpRequest | null = new XMLHttpRequest();
		xhr.open(method.toUpperCase(), url.toString());

		for (const [header, value] of Object.entries(headers).filter(
			([header]) => !FORBIDDEN_HEADERS.includes(header)
		)) {
			xhr.setRequestHeader(header, value as string);
		}

		xhr.responseType = responseType;

		if (emitter) {
			xhr.upload.addEventListener('progress', event => {
				emitter.emit(SEND_UPLOAD_PROGRESS_EVENT, event);
				logger.debug(event);
			});
			xhr.addEventListener('progress', event => {
				emitter.emit(SEND_DOWNLOAD_PROGRESS_EVENT, event);
				logger.debug(event);
			});
		}

		xhr.addEventListener('error', () => {
			const error = simulateAxiosError(
				NETWORK_ERROR_MESSAGE,
				NETWORK_ERROR_CODE,
				xhr!,
				options
			);
			logger.error(NETWORK_ERROR_MESSAGE);
			reject(error);
			xhr = null; // clean up request
		});

		// Handle browser request cancellation (as opposed to a manual cancellation)
		xhr.addEventListener('abort', () => {
			if (!xhr) return;
			const error = simulateAxiosError(
				ABORT_ERROR_MESSAGE,
				ABORT_ERROR_CODE,
				xhr,
				options
			);
			logger.error(ABORT_ERROR_MESSAGE);
			reject(error);
			xhr = null; // clean up request
		});

		// Skip handling timeout error since we don't have a timeout

		xhr.addEventListener('readystatechange', () => {
			if (!xhr || xhr.readyState !== xhr.DONE) {
				return;
			}

			const onloadend = () => {
				if (!xhr) return;
				const responseHeaders = convertResponseHeaders(
					xhr.getAllResponseHeaders()
				);
				const responseBlob = xhr.response as Blob;
				const responseText = xhr.responseText;
				const bodyMixIn: ResponseBodyMixin = {
					blob: () => Promise.resolve(responseBlob),
					text: () => Promise.resolve(responseText),
					json: () =>
						Promise.reject(
							new Error(
								'Parsing response to JSON is not implemented. Please use response.text() instead.'
							)
						),
				};
				const response: CompatibleHttpResponse = {
					statusCode: xhr.status,
					headers: responseHeaders,
					// The xhr.responseType is only set to 'blob' for streaming binary S3 object data. The streaming data is
					// exposed via public interface of Storage.get(). So we need to return the response as a Blob object for
					// backward compatibility. In other cases, the response payload is only used internally, we return it is
					// {@link ResponseBodyMixin}
					body: (xhr.responseType === 'blob'
						? Object.assign(responseBlob, bodyMixIn)
						: bodyMixIn) as CompatibleHttpResponse['body'],
				};
				resolve(response);
				xhr = null; // clean up request
			};

			// TODO: V6 use xhr.onloadend() when we officially drop support for IE11. Keep it to reduce surprise even though we
			// don't support IE11 in v5.
			setTimeout(onloadend);
		});

		if (abortSignal) {
			const onCancelled = () => {
				if (!xhr) {
					return;
				}
				const canceledError = simulateAxiosCanceledError(
					CANCELED_ERROR_MESSAGE,
					CANCELED_ERROR_CODE,
					xhr,
					options
				);
				reject(canceledError);
				xhr.abort();
				xhr = null;
			};
			abortSignal.aborted
				? onCancelled()
				: abortSignal.addEventListener('abort', onCancelled);
		}

		if (
			typeof ReadableStream === 'function' &&
			body instanceof ReadableStream
		) {
			throw new Error('ReadableStream request payload is not supported.');
		}

		xhr.send((body as Exclude<BodyInit, ReadableStream>) || null);
	});
};

// TODO: V6 remove this
const simulateAxiosError = (
	message: string,
	code: string,
	request: XMLHttpRequest,
	config: XhrTransferHandlerOptions
) =>
	Object.assign(new Error(message), {
		code,
		config,
		request,
	});

const simulateAxiosCanceledError = (
	message: string,
	code: string,
	request: XMLHttpRequest,
	config: XhrTransferHandlerOptions
) => {
	const error = simulateAxiosError(message, code, request, config);
	error.name = 'CanceledError';
	error['__CANCEL__'] = true;
	return error;
};

/**
 * Convert xhr.getAllResponseHeaders() string to a Record<string, string>. Note that modern browser already returns
 * header names in lowercase.
 * @param xhrHeaders - string of headers returned from xhr.getAllResponseHeaders()
 */
const convertResponseHeaders = (xhrHeaders: string): Record<string, string> => {
	if (!xhrHeaders) {
		return {};
	}
	return xhrHeaders
		.split('\r\n')
		.reduce((headerMap: Record<string, string>, line: string) => {
			const parts = line.split(': ');
			const header = parts.shift()!;
			const value = parts.join(': ');
			headerMap[header.toLowerCase()] = value;
			return headerMap;
		}, {});
};

// TODO: Add more forbidden headers as found set by S3. Do not list all of them here to save bundle size.
// https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name
const FORBIDDEN_HEADERS = ['host'];
