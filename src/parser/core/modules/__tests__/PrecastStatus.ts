// region CodeUnderTest
import {PrecastStatus} from '../PrecastStatus'
// endregion

// region Dependencies

// endregion

// tslint:disable:no-magic-numbers
// region Mocks
import {MockedParser} from '__mocks__/Parser'
const parser = new MockedParser()
import {MockedData} from '__mocks__/Data'
const data = new MockedData()
// endregion

// region MockedData
// endregion

// region MockedEvents
// endregion

describe('The PrecastStatus module', () => {
	let precastStatus: PrecastStatus

	beforeEach(() => {
		Object.defineProperty(parser, 'fight', {value: {start_time: 0}})
		Object.defineProperty(parser, 'modules', {value: {data}})

		precastStatus = new PrecastStatus(parser)
	})

	it('has a normalise method', () => {
		expect(precastStatus).toHaveProperty('normalise')
	})
})
