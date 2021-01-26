/* eslint-env es6, node, jest */

// Extra jest libs
// This should be kept in sync with declararion imports in `src/definitions/jestExtensions.d.ts`
import 'jest-chain'
import 'jest-extended'

// Mock LS
const localStorageMock = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	clear: jest.fn(),
}
global.localStorage = localStorageMock
