jest.mock('parser/core/modules/Statistics', () => ({
	__esModule: true,
	Statistics: jest.fn().mockImplementation(() => ({
		add: jest.fn(),
	})),
}))
import {Statistics} from 'parser/core/modules/Statistics'
export {Statistics}
