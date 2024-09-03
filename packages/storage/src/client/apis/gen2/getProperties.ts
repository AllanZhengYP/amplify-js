// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Amplify } from '@aws-amplify/core';
import { StorageAction } from '@aws-amplify/core/internals/utils';
import { getProperties as getPropertiesBase } from '..//base/getProperties';
import {
	GetPropertiesWithPathInput as GetPropertiesGen2Input,
	GetPropertiesWithPathOutput as GetPropertiesGen2Output,
} from '../../../providers/s3/types';
import { resolveS3ConfigAndInput } from '../../../providers/s3/utils';
import { assertValidationError } from '../../../errors/utils/assertValidationError';
import { StorageValidationErrorCode } from '../../../errors/types/validation';
import { resolveIdentityId } from '../../../providers/s3/utils/resolveIdentityId';
import { logger } from '../../../utils';
import { getStorageUserAgentValue } from '../../../providers/s3/utils/userAgent';

export async function getProperties(
	input: GetPropertiesGen2Input,
	action?: StorageAction,
): Promise<GetPropertiesGen2Output> {
	const {
		identityId,
		bucket,
		s3Config: { credentials, region },
	} = await resolveS3ConfigAndInput(Amplify, input);
	const { path } = input;

	const objectKey =
		typeof path === 'string'
			? path
			: path({ identityId: resolveIdentityId(identityId) });
	assertValidationError(
		!objectKey.startsWith('/'),
		StorageValidationErrorCode.InvalidStoragePathInput,
	);
	logger.debug(`get properties of ${objectKey} from ${objectKey}`);
	const response = await getPropertiesBase({
		input: {
			bucket,
			key: objectKey,
		},
		config: {
			credentialsProvider: credentials as any, // TODO: fix this
			region,
			customUserAgent: getStorageUserAgentValue(action ?? StorageAction.GetProperties),
		},
	});
	const result: GetPropertiesGen2Output = {
		path: objectKey,
		...response,
	};
	delete (result as any).key
	return result;
}
