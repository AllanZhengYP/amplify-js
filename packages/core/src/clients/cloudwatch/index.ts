export const getContext = (options: { region: string }) => ({
	service: 'cloudwatch',
	endpointProvider: () =>
		Promise.resolve({
			url: new URL(`https://logs.cloudwatch.${options.region}.amazonaws.com`),
		}),
});
