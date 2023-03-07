import type {
	GetCredentialsForIdentityCommandInput,
	GetCredentialsForIdentityCommandOutput,
} from '@aws-sdk/client-cognito-identity';
import { httpClient } from '../base';
import { composeServiceApi } from '../internal/client';
import { Endpoint } from '../types/core';
import { HttpRequest, HttpResponse } from '../types/http';
import { parseBody, throwError } from '../protocol/rest-json';

export type {
	GetCredentialsForIdentityCommandInput,
	GetCredentialsForIdentityCommandOutput,
} from '@aws-sdk/client-cognito-identity';

const getCredentialsForIdentitySerializer = async (
	input: GetCredentialsForIdentityCommandInput,
	endpoint: Endpoint
): Promise<HttpRequest> => {
	return {
		headers: new Headers({
			'content-type': 'application/x-amz-json-1.1',
			'x-amz-target': 'AWSCognitoIdentityService.GetCredentialsForIdentity',
		}),
		method: 'POST',
		destination: endpoint.url,
		body: JSON.stringify(input),
	};
};

const getCredentialsForIdentityDeserializer = async (
	response: HttpResponse
): Promise<GetCredentialsForIdentityCommandOutput> => {
	if (response.statusCode >= 300) {
		throw await throwError(response);
	} else {
		const body = await parseBody(response);

		return {
			...body,
			Credentials: {
				...body.Credentials,
				Expiration: new Date(body.Credentials.Expiration * 1000),
			},
		} as GetCredentialsForIdentityCommandOutput;
	}
};

export const getCredentialsForIdentity = composeServiceApi(
	httpClient,
	getCredentialsForIdentitySerializer,
	getCredentialsForIdentityDeserializer
);
