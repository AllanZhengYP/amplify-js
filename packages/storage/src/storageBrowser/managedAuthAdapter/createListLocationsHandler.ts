// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CredentialsProvider, ListLocationsHandler } from '../types';

export interface CreateListLocationsHandlerInput {
	accountId: string;
	credentialsProvider: CredentialsProvider;
	region: string;
	options?: {
		nextToken?: string;
		// Default to 100; If > 1000, API will make multiple API calls.
		pageSize?: number;
	};
}

export const createListLocationsHandler = (
	// eslint-disable-next-line unused-imports/no-unused-vars
	input: CreateListLocationsHandlerInput,
): ListLocationsHandler => {
	// TODO(@AllanZhengYP)
	throw new Error('Not Implemented');
};
