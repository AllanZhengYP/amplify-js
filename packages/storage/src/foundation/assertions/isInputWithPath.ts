// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { assertValidationError } from '../../errors/utils/assertValidationError';
import { StorageValidationErrorCode } from '../../errors/types/validation';

import {
	StorageOperationInputWithKey,
	StorageOperationInputWithPath,
} from '../../types/inputs';

export const isInputWithPath = <
	Gen1Input extends StorageOperationInputWithKey,
	Gen2Input extends StorageOperationInputWithPath,
>(
	input: Gen1Input | Gen2Input,
	// identityId?: string,
): input is Gen1Input => {
	assertValidationError(
		// Key present without a path
		(!!(input as Gen1Input).key && !(input as Gen2Input).path) ||
			// Path present without a key
			(!(input as Gen1Input).key && !!(input as Gen2Input).path),
		StorageValidationErrorCode.InvalidStorageOperationInput,
	);
	return (input as Gen2Input).path !== undefined;
};
