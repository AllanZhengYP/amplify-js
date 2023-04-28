import {
	Headers,
	HttpRequest,
	HttpResponse,
	TransferHandler,
	ResponseBodyMixin,
} from '@aws-amplify/core/lib-esm/clients/types';
import { ConsoleLogger as Logger, Platform } from '@aws-amplify/core';
import axios, {
	AxiosRequestConfig,
	Method,
	CancelTokenSource,
	AxiosError,
	AxiosResponse,
} from 'axios';
import type { EventEmitter } from 'events';
import { AWSS3ProviderUploadErrorStrings } from '../../common/StorageErrorStrings';

const logger = new Logger('axios-http-handler');
export const SEND_UPLOAD_PROGRESS_EVENT = 'sendUploadProgress';
export const SEND_DOWNLOAD_PROGRESS_EVENT = 'sendDownloadProgress';

export interface AxiosTransferHandlerOptions {
	cancelTokenSource?: CancelTokenSource; // TODO: use abort controller in v6.
	emitter?: EventEmitter;
}

export const axiosTransferHandler: TransferHandler<
	HttpRequest,
	HttpResponse,
	AxiosTransferHandlerOptions
> = async (request, options) => {
	const { emitter, cancelTokenSource } = options;
	const { url, method, headers, body } = request;
	const axiosRequest: AxiosRequestConfig = {};
	axiosRequest.url = url.toString();
	axiosRequest.method = method as Method;
	axiosRequest.headers = headers;

	// The host header is automatically added by the browser and adding it explicitly in the
	// axios request throws an error https://github.com/aws-amplify/amplify-js/issues/5376
	// This is because the host header is a forbidden header for the http client to set
	// see https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name and
	// https://fetch.spec.whatwg.org/#forbidden-header-name
	// The reason we are removing this header here instead of in the aws-sdk's client
	// middleware is that the host header is required to be in the request signature and if
	// we remove it from the middlewares, then the request fails because the header is added
	// by the browser but is absent from the signature.
	delete axiosRequest.headers['host'];

	if (body) {
		axiosRequest.data = body;
	} else if (axiosRequest.headers['content-type']) {
		// Fix for https://github.com/aws-amplify/amplify-js/issues/5432

		// If the POST request body is empty but content-type header is set, axios is forcibly removing it
		// See https://github.com/axios/axios/issues/1535 and refusing to fix it https://github.com/axios/axios/issues/755
		// This change is a workaround to set the data as null (instead of undefined) to prevent axios from
		// removing the content-type header. Link for the source code
		// https://github.com/axios/axios/blob/dc4bc49673943e35280e5df831f5c3d0347a9393/lib/adapters/xhr.js#L121-L123

		axiosRequest.data = null;
	}

	if (emitter) {
		axiosRequest.onUploadProgress = event => {
			emitter.emit(SEND_UPLOAD_PROGRESS_EVENT, event);
			logger.debug(event);
		};
		axiosRequest.onDownloadProgress = event => {
			emitter.emit(SEND_DOWNLOAD_PROGRESS_EVENT, event);
			logger.debug(event);
		};
	}

	if (cancelTokenSource) {
		axiosRequest.cancelToken = cancelTokenSource.token;
	}

	axiosRequest.responseType = 'blob';

	if (Platform.isReactNative) {
		// TODO: handle react native
	}

	try {
		const response = await axios.request<Blob>(axiosRequest);
		const { status: statusCode, headers: responseHeaders, data } = response;
		return {
			statusCode,
			headers: responseHeaders ?? ({} as Headers),
			body: getDecoratedAxiosResponseData(response),
		};
	} catch (error) {
		if (
			error.message !== AWSS3ProviderUploadErrorStrings.UPLOAD_PAUSED_MESSAGE
		) {
			logger.error(error.message);
		}
		// for axios' cancel error, we should re-throw it back so it's not considered an s3client error
		// if we return empty, or an abitrary error HttpResponse, it will be hard to debug down the line.
		//
		// for errors that does not have a 'response' object, it's very likely that it is an unexpected error for
		// example a disconnect. Without it we cannot meaningfully reconstruct a HttpResponse, and the AWS SDK might
		// consider the request successful by mistake. In this case we should also re-throw the error.
		const { response: axiosErrorResponse } = error as AxiosError<Blob>;
		if (
			axios.isCancel(error) ||
			!axiosErrorResponse ||
			typeof axiosErrorResponse?.status !== 'number'
		) {
			throw error;
		}

		// otherwise, we should re-construct an HttpResponse from the error, so that it can be passed down to other
		// aws sdk middleware (e.g retry, clock skew correction, error message serializing)
		const { status: statusCode } = axiosErrorResponse;
		return {
			statusCode,
			body: getDecoratedAxiosResponseData(axiosErrorResponse),
			headers: axiosErrorResponse.headers ?? {},
		};
	}
};

const getDecoratedAxiosResponseData = (
	response: AxiosResponse<Blob>
): ResponseBodyMixin => {
	const { data } = response;
	return Object.assign(data ?? {}, {
		async blob() {
			return data;
		},
		async text() {
			return data.text();
		},
		async json() {
			throw new Error('not implemented');
		},
	});
};
