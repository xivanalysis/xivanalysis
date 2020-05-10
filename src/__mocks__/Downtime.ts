jest.mock('parser/core/modules/Downtime', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({
		getDowntime: jest.fn(),
	})),
}))

import Downtime from 'parser/core/modules/Downtime'
export default Downtime
