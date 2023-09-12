/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	transform: {
		'^.+\\.(js|jsx|ts|tsx)$': [
			'ts-jest',
			{
				diagnostics: false,
				tsconfig: `${__dirname}/tsconfig.test.json`,
			},
		],
	},
	testRegex: '(/__tests__/.*|\\.(test|spec))\\.(tsx?|jsx?)$',
	testPathIgnorePatterns: ['/testUtils/'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'jsx'],
	testEnvironment: 'jsdom',
	testEnvironmentOptions: {
		url: 'https://localhost/',
	},
	coveragePathIgnorePatterns: ['/node_modules/', 'dist', 'lib', 'lib-esm'],
};
