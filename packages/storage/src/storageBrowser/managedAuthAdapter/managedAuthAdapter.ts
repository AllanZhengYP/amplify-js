/* eslint-disable unused-imports/no-unused-vars */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
	CredentialsProvider,
	ListLocationsHandler,
	LocationCredentialsHandler,
} from '../types';

import { credentialsCachingDecorator } from './credentialsCachingDecorator';

export interface ManagedAuthAdapterInput {
	accountId: string;
	region: string;
	credentialsProvider: CredentialsProvider;
}

export interface ManagedAuthAdapterOutput {
	listLocations: ListLocationsHandler;
	getLocationCredentials: LocationCredentialsHandler;
	region: string;
}

export const managedAuthAdapter = (
	// eslint-disable-next-line unused-imports/no-unused-vars
	{ credentialsProvider, region, accountId }: ManagedAuthAdapterInput,
): ManagedAuthAdapterOutput => {
	const credentialsProviderCaching =
		credentialsCachingDecorator(credentialsProvider);
};
