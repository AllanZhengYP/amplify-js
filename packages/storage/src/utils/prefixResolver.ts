// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StorageAccessLevel } from '@aws-amplify/core';
import { assertValidationError } from '../errors/assertValidationErrors';
import { StorageValidationErrorCode } from '../errors/types/validation';

type PrefixResolverOptions = {
	level: StorageAccessLevel;
	identityId?: string;
};

export const prefixResolver = async ({
	level,
	identityId,
}: PrefixResolverOptions) => {
	if (level === 'private') {
		assertValidationError(
			!!identityId,
			StorageValidationErrorCode.NoIdentityId
		);
		return `private/${identityId}/`;
	} else if (level === 'protected') {
		assertValidationError(
			!!identityId,
			StorageValidationErrorCode.NoIdentityId
		);
		return `protected/${identityId}/`;
	} else {
		return 'public/';
	}
};
