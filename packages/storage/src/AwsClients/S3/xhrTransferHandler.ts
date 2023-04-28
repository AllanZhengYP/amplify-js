import {
	Headers,
	HttpRequest,
	HttpResponse,
	TransferHandler,
	ResponseBodyMixin,
} from '@aws-amplify/core/lib-esm/clients/types';
import { ConsoleLogger as Logger, Platform } from '@aws-amplify/core';

interface XhrTransferHandlerOptions {
	cancelToken?: CancelTokenSource;
	onProgress?: (progress: number) => void;
}

interface CancelTokenSource {
	cancel: (reason?: any) => void;
	promise: Promise<any>;
}

export const xhrTransferHandler: TransferHandler<
	HttpRequest,
	HttpResponse,
	XhrTransferHandlerOptions
> = (request, options): Promise<HttpResponse> => {
	const { url, method, headers, body } = request;
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open(method, url.toString());

		xhr.onload = function () {
			if (this.status >= 200 && this.status < 300) {
				resolve(xhr.response);
			} else {
				reject({
					status: this.status,
					statusText: xhr.statusText,
				});
			}
		};

		xhr.onerror = function () {
			reject({
				status: this.status,
				statusText: xhr.statusText,
			});
		};

		if (options.headers) {
			Object.keys(options.headers).forEach(key => {
				xhr.setRequestHeader(key, options.headers![key]);
			});
		}

		let _progress = options.onProgress || function () {};
		xhr.upload.onprogress = function (event) {
			if (event.lengthComputable) {
				_progress(event.loaded / event.total);
			}
		};

		xhr.responseType = options.responseType || 'json';
		xhr.send(options.body);

		if (options.cancelToken) {
			options.cancelToken.promise.then(function (cancel) {
				xhr.abort();
				reject(cancel);
			});
		}
	});
};
