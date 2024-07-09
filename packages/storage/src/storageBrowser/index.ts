// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export {
	listCallerAccessGrants,
	CreateListLocationsHandlerInput as ListCallerAccessGrantsInput,
	ListCallerAccessGrantsOutput,
} from './managedAuthAdapter/createListLocationsHandler';
export { createLocationCredentialsHandler } from './managedAuthAdapter/createLocationCredentialsHandler';
export { createLocationCredentialsStore } from './locationCredentialsStore';
export {
	managedAuthAdapter,
	ManagedAuthAdapterInput,
} from './managedAuthAdapter/managedAuthAdapter';
