/* eslint-env es6, node, jest */

// Extra jest libs
import 'jest-chain'
import 'jest-extended'

// Mock LS
const localStorageMock = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	clear: jest.fn(),
}
global.localStorage = localStorageMock
