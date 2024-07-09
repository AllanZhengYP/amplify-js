/* eslint-disable unused-imports/no-unused-vars */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { AWSCredentials } from '@aws-amplify/core/internals/utils';

import { CredentialsProvider } from '../types';

/**
 * An high-level function that wraps the input credentials provider. It calls
 * the input credentials provider if the credentials are not cached or expired.
 * It also deduplicates concurrent calls to the input credentials provider.
 *
 * @internal
 */
export const credentialsCachingDecorator = (
	credentialsProvider: CredentialsProvider,
): CredentialsProvider => {
	let cachedCredentials: AWSCredentials | undefined;

	return async (input: Parameters<CredentialsProvider>[0] = {}) => {
		const { forceRefresh } = input;
		if (
			!forceRefresh &&
			cachedCredentials &&
			(cachedCredentials.expiration?.getTime() ?? 0) > Date.now()
		) {
			return { credentials: cachedCredentials };
		}
		const credentials = await credentialsProvider();

		return credentials;
	};
};
