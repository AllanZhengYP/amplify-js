// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StorageAction } from '@aws-amplify/core/internals/utils';
import {
	GetPropertiesInput as GetPropertiesGen1Input,
	GetPropertiesOutput as GetPropertiesGen1Output,
	GetPropertiesWithPathInput as GetPropertiesGen2Input,
	GetPropertiesWithPathOutput as getPropertiesGen2Output,
} from '../../providers/s3/types';
import { isInputWithPath } from '../../foundation/assertions/isInputWithPath';
import { getProperties as getPropertiesDeprecated } from './gen1/getProperties';
import { getProperties as getPropertiesGen2 } from './gen2/getProperties';

/**
 * @deprecated The `key` and `accessLevel` parameters are deprecated and may be removed in the next major version.
 * Please use {@link https://docs.amplify.aws/javascript/build-a-backend/storage/get-properties/ | path} instead.
 *
 * Gets the properties of a file. The properties include S3 system metadata and
 * the user metadata that was provided when uploading the file.
 *
 * @param input - The `GetPropertiesInput` object.
 * @returns Requested object properties.
 * @throws An `S3Exception` when the underlying S3 service returned error.
 * @throws A `StorageValidationErrorCode` when API call parameters are invalid.
 */
export async function getProperties (
	input: GetPropertiesGen1Input,
): Promise<GetPropertiesGen1Output>

/**
 * Gets the properties of a file. The properties include S3 system metadata and
 * the user metadata that was provided when uploading the file.
 *
 * @param input - The `GetPropertiesWithPathInput` object.
 * @returns Requested object properties.
 * @throws An `S3Exception` when the underlying S3 service returned error.
 * @throws A `StorageValidationErrorCode` when API call parameters are invalid.
 */
export function getProperties (
	input: GetPropertiesGen2Input,
): Promise<getPropertiesGen2Output>

export async function getProperties (
	input: GetPropertiesGen1Input | GetPropertiesGen2Input,
	action?: StorageAction,
): Promise<GetPropertiesGen1Output | getPropertiesGen2Output> {
  if (isInputWithPath<GetPropertiesGen1Input, GetPropertiesGen2Input>(input)) {
		return getPropertiesDeprecated(input);
	} else {
		return getPropertiesGen2(input, action);
	}
};
