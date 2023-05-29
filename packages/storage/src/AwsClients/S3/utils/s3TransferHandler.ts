// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
	retryMiddleware,
	RetryOptions,
	signingMiddleware,
	SigningOptions,
	userAgentMiddleware,
	UserAgentOptions,
	composeTransferHandler,
	HttpRequest,
	HttpResponse,
} from '@aws-amplify/core/internals/aws-client-utils';

import { xhrTransferHandler } from './xhrTransferHandler';

export const authenticatedHandler = composeTransferHandler<
	[UserAgentOptions, RetryOptions<HttpResponse>, SigningOptions],
	HttpRequest,
	HttpResponse
>(xhrTransferHandler, [
	userAgentMiddleware,
	retryMiddleware,
	signingMiddleware,
]);

// TODO: retry and auth
export const s3TransferHandler = xhrTransferHandler;
