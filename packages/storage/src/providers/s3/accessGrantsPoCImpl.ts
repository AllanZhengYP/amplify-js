import { S3ControlClient, ListAccessGrantsCommand, GetDataAccessCommand } from '@aws-sdk/client-s3-control';

import {
	ListCallerAccessGrantsInput,
	ListCallerAccessGrantsOutput,
	LocationCredentialsHandler,
	LocationCredentialsStore,
	CredentialsProvider,
	LocationCredentialsProvider
} from './accessGrantsPoC';
import { AWSCredentials } from '@aws-amplify/core/internals/utils';
import { list } from './apis';

const listCallerAccessGrants: (
	input: ListCallerAccessGrantsInput,
) => Promise<ListCallerAccessGrantsOutput> = async (input) => {
	const client = new S3ControlClient({
		region: input.options.region,
		credentials: input.options.credentialsProvider
	});
	const res = (await client.send(
		new ListAccessGrantsCommand({
			AccountId: input.accountId,
		}),
	));
	return {
		locations: res!.AccessGrantsList!.map((grant) => {
			const bucket = grant.GrantScope?.replace('s3://', '').split('/')[0];
			if (!bucket) {
				throw new Error('Invalid grant scope ' + grant.GrantScope);
			}
			return {
				scope: grant.GrantScope ?? '',
				permission: grant.Permission!, // TODO
				applicationArn: grant.ApplicationArn, // TODO
				bucket
			}
		}),
		nextToken: res?.NextToken
	};
};

export const createLocationCredentialsStore: (input: {
  handler: LocationCredentialsHandler;
}) => LocationCredentialsStore = (input) => {
	let destroyed = false;
	// TODO: caching
	let cache: Record<string, CredentialsProvider>;
	const provider: LocationCredentialsProvider = async ({ locations, permission, forceRefresh }) => {
		if (destroyed) {
			throw new Error('Store is destroyed');
		}
		// LCA of input locations
		const scope = `s3://${locations[0].bucket}/${locations[0].path}/*`;
		const { credentials: locationCredentials, scope: cachingScope } = await input.handler({
			scope,
			permission,
		});
		return locationCredentials
	}
	return {
		getProvider: () => provider,
		destroy: () => {
		  destroyed = true;
		},
	}
};

const createLocationCredentialsHandler: (input: {
	region: string;
	credentialsProvider: CredentialsProvider;
	accountId: string;
}) => LocationCredentialsHandler = (input) => {
	const client = new S3ControlClient({
		region: input.region,
		credentials: input.credentialsProvider
	});
	return async ({ scope, permission }) => {
		const res = await client.send(
			new GetDataAccessCommand({
				AccountId: input.accountId,
				Target: scope,
				Permission: permission,
			}),
		);
		return {
			credentials: {
				accessKeyId: res!.Credentials!.AccessKeyId!,
				secretAccessKey: res!.Credentials!.SecretAccessKey!,
				sessionToken: res!.Credentials!.SessionToken!,
				expiration: res!.Credentials!.Expiration!,
			},
			scope: scope
		}
	}
}

export const listExample = async () => {
	const accountId = '650138640062';
	const region = 'us-east-2';
	const bucket = 'amplify-library-test-bucket-cmh'
	// user your input aws credentials
	const tmpCreds: AWSCredentials = {
		"accessKeyId": "",
		"secretAccessKey": "",
		"sessionToken": "",
		"expiration": new Date(1718212607000)
	}
	const locationsCredentialsStore = createLocationCredentialsStore({
		handler: createLocationCredentialsHandler({
			region,
			accountId,
			credentialsProvider: async () => tmpCreds
		}),
	})
	const { items } = await list({
		path: 'test',
		options: {
			locationCredentialsProvider: locationsCredentialsStore.getProvider({
				scope: 's3://amplify-library-test-bucket-cmh/test/*',
				permission: 'READ'
			}),
			bucket,
			region
		}
	});
	console.log('items', items);
}


