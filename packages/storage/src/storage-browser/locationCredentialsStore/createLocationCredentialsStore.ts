// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AWSCredentials } from '@aws-amplify/core/internals/utils';

import {
	Location,
	LocationCredentialsHandler,
	LocationCredentialsStore,
} from '../types';

import { createStore, getValue, removeStore, setRecord } from './storeRegistry';

// eslint-disable-next-line unused-imports/no-unused-vars
export const createLocationCredentialsStore = (input: {
	handler: LocationCredentialsHandler;
}): LocationCredentialsStore => {
	const storeReference = createStore();

	return {
		getProvider({ scope, permission }: Location) {
			return async () => {
				// TODO(@AllanZhengYP): validate scope, permission
				// TODO(@AllanZhengYP): validate bucket, location, permission
				const cachedValue = getValue({
					storeReference,
					key: { scope, permission },
				});
				if (!cachedValue || pastTTL(cachedValue.credentials)) {
					// TODO(@AllanZhengYP): deduplicate requests by caching key
					const { credentials } = await input.handler({
						scope,
						permission,
					});
					setRecord({
						storeReference,
						key: { scope, permission },
						value: { credentials },
					});
				}

				return getValue({ storeReference, key: { scope, permission } })!;
			};
		},
		destroy() {
			removeStore(storeReference);
		},
	};
};

const pastTTL = (credentials: AWSCredentials) => {
	const { expiration } = credentials;

	// TODO(@AllanZhengYP): refresh creds a window before expiration
	return expiration && expiration.getTime() <= Date.now();
};
