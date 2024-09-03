// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { LocationCredentialsProvider } from '../../providers/s3/types/options';
import { ItemBase } from '../../providers/s3/types/outputs';
import { StorageItemBase } from '../../types/outputs';
import { createHeadObjectHandler } from '../factories/serviceClients/s3/createHeadObjectHandler';

/**
 * getProperties API
 * |___client API
 *     |___gen1/gen2
 *         |___singleton
 *         |___advanced API
 *             |___deps: xml deser, md5, crc32, http handler
 *             |___[foundational API(configs, input, deps injection)]
 * |___server API
 *     |___gen1/gen2
 *         |___request context
 *         |___advanced API
 *             |___deps: xml deser, md5, crc32, http handler
 * 		         |___[foundational API(configs, input, deps injection)]
 *
 */

export interface GetPropertiesInput {
	input: {
		bucket: string;
		key: string;
	};
	config: {
		region: string;
		credentialsProvider: LocationCredentialsProvider;
		customEndpoint?: string;
		userAgentValue?: string;
		// TBD:
		customHeaders?: (
			existingHeaders: Record<Lowercase<string>, string>,
		) => Promise<Record<Lowercase<string>, string>>;

	};
	dependencies: {
		xmlBodyParser: (xmlStr: string) => any;
	};
}

export interface GetPropertiesOutput extends ItemBase, StorageItemBase {
	key: string;
}

export const getProperties = async ({
	input: { bucket, key },
	config: { region, customEndpoint, credentialsProvider, userAgentValue },
	dependencies: { xmlBodyParser }
}: GetPropertiesInput): Promise<GetPropertiesOutput> => {
	const headObject = createHeadObjectHandler({
		// TODO: dependency injection of transfer handler
		xmlBodyParser
	});
	const response = await headObject(
		{
			// TODO: dependency injection of transfer handler
			// @ts-ignore
			credentials: async () => {
				const { credentials } = await credentialsProvider();
				return credentials;
			},
			region,
			customEndpoint,
			userAgentValue,
		},
		{
			Bucket: bucket,
			Key: key,
		},
	);
	const result = {
		key,
		contentType: response.ContentType,
		size: response.ContentLength,
		eTag: response.ETag,
		lastModified: response.LastModified,
		metadata: response.Metadata,
		versionId: response.VersionId,
	};
	return result;
};
