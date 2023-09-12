const baseJestConfig = require('../../jest.config.base');
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	...baseJestConfig,
	testPathIgnorePatterns: ['xmlParser-fixture.ts', 'testUtils', 'cases'],
};
