/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	transform: {
		'^.+\\.(js|jsx|ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: {
					types: ['jest', 'node'],
					// TODO: update unit test to allow stricter type checks in the unit tests.
					noEmitOnError: false,
					noImplicitAny: false,
					skipLibCheck: true,
					allowJs: true,
					strict: false,
				},
			},
		],
	},
	testRegex: '(/__tests__/.*|\\.(test|spec))\\.(tsx?|jsx?)$',
	testPathIgnorePatterns: ['/testUtils/'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'jsx'],
	setupFiles: ['./__mocks__/SessionStorage.js', './__mocks__/LocalStorage.js'],
	testEnvironment: 'jsdom',
	testEnvironmentOptions: {
		url: 'https://localhost/',
	},
	coveragePathIgnorePatterns: ['/node_modules/', 'dist', 'lib', 'lib-esm'],
};
