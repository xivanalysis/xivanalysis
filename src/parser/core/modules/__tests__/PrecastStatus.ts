// region CodeUnderTest
import {PrecastStatus} from '../PrecastStatus'
// tslint:disable:no-magic-numbers
// region Mocks
import {MockedParser} from '__mocks__/Parser'
import Parser from 'parser/core/Parser'
import {MockedData} from '__mocks__/Data'
const data = new MockedData()

// region MockedData
import {Ability, AbilityEvent, AbilityType} from 'fflogs'
const mockAbility: Ability = {
	guid: 1,
	name: 'Ability 1',
	abilityIcon: '',
	type: AbilityType.PHYSICAL_DIRECT,
}
data.mockAction({
	id: 1,
	name: 'Ability 1',
	icon: '',
})

const mockStatus: Ability = {
	guid: 1000001,
	name: 'Status 1',
	abilityIcon: '',
	type: AbilityType.SPECIAL,
}
data.mockStatus({
	id: 1,
	name: 'Status 1',
	icon: '',
})

// region MockedEvents
import {mockCastEvent, mockApplyBuffEvent, mockApplyBuffStackEvent, mockRemoveBuffEvent, mockRemoveBuffStackEvent, mockRefreshBuffEvent} from '__mocks__/Events'
import {Event} from 'events'
// endregion

// region Dependencies

// endregion
// endregion

// endregion
// endregion

describe('The PrecastStatus module', () => {
	let precastStatus: PrecastStatus
	let parser: Parser
	const events: Event[] = []

	beforeEach(() => {
		parser = new MockedParser()
		Object.defineProperty(parser, 'fight', {value: {start_time: 0}})
		Object.defineProperty(parser, 'modules', {value: {data}})

		precastStatus = new PrecastStatus(parser)
		jest.spyOn(data, 'getAction')
		jest.spyOn(data, 'getStatus')
	})

	it('has a normalise method', () => {
		expect(precastStatus).toHaveProperty('normalise')
	})

	describe('when a buff event has a matching cast event first', () => {
		beforeEach(() => {
			events.push(mockCastEvent(50, mockAbility))
			events.push(mockApplyBuffEvent(100, mockStatus))
			events.push(mockRemoveBuffEvent(1100, mockStatus))
		})

		it('looks up the action', () => {
			precastStatus.normalise(events)
			expect(data.getAction).toBeCalledWith(1).toHaveBeenCalledTimes(1)
		})

		it('marks the action as tracked', () => {
			jest.spyOn(precastStatus, 'markActionAsTracked')

			precastStatus.normalise(events)
			expect(precastStatus.markActionAsTracked).toBeCalledWith(1).toHaveBeenCalledTimes(1)
		})

		it('does not fabricate a cast event', () => {
			jest.spyOn(precastStatus, 'fabricateCastEvent')

			precastStatus.normalise(events)
			expect(precastStatus.fabricateCastEvent).not.toHaveBeenCalled()
		})

		it('does not fabricate a buff event', () => {
			jest.spyOn(precastStatus, 'fabricateBuffEvent')

			precastStatus.normalise(events)
			expect(precastStatus.fabricateBuffEvent).not.toHaveBeenCalled()
		})
	})
})
