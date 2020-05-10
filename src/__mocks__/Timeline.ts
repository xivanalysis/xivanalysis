export const mockRowAddItem = jest.fn()
const mockContainerRow = jest.fn().mockImplementation(() => ({
	addItem: mockRowAddItem,
}))
jest.mock('parser/core/modules/Timeline', () => ({
	__esModule: true,
	Timeline: jest.fn().mockImplementation(() => ({
		addRow: jest.fn().mockImplementation(() => mockContainerRow()),
	})),
	ContainerRow: jest.fn().mockImplementation(() => ({
		addItem: mockRowAddItem,
	})),
}))
import {Timeline, ContainerRow} from 'parser/core/modules/Timeline'
export {Timeline, ContainerRow}
