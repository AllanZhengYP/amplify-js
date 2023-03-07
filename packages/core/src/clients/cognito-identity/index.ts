export * from './get-id';
export * from './get-credentials-for-identity';

export const getContext = (options: { region: string }) => ({
	service: 'cognito-identity',
	endpointProvider: () =>
		Promise.resolve({
			url: new URL(`https://cognito-identity.${options.region}.amazonaws.com`),
		}),
});
