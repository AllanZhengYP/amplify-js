// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Amplify } from '@aws-amplify/core';
import { StorageAction } from '@aws-amplify/core/internals/utils';
import { getProperties as getPropertiesBase } from '../base/getProperties';
import {
	GetPropertiesInput as GetPropertiesGen1Input,
	GetPropertiesOutput as GetPropertiesGen1Output,
} from '../../../providers/s3/types';
import { resolveS3ConfigAndInput } from '../../../providers/s3/utils';
import { getStorageUserAgentValue } from '../../../providers/s3/utils/userAgent';

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
	action?: StorageAction,
): Promise<GetPropertiesGen1Output> {
	const { bucket, keyPrefix, s3Config: { region, credentials } } = await resolveS3ConfigAndInput(Amplify, input);
	const finalKey = keyPrefix + input.key;
	const response = await getPropertiesBase({
		input: {
			bucket,
			key: finalKey
		},
		config: {
			credentialsProvider: credentials as any, // TODO: fix this
			region,
			userAgentValue: getStorageUserAgentValue(action ?? StorageAction.GetProperties),
		}
	});
	return {
		...response,
		key: input.key,
	}
}