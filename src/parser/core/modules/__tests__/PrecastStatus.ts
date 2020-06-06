// region CodeUnderTest
import {PrecastStatus} from '../PrecastStatus'
// endregion
// tslint:disable:no-magic-numbers
// region Mocks
import {MockedParser} from '__mocks__/Parser'
import Parser from 'parser/core/Parser'
import {MockedData} from '__mocks__/Data'

let precastStatus: PrecastStatus
let parser: Parser

// region MockedData
import {Ability, AbilityType} from 'fflogs'
// region MockedEvents
import {mockApplyBuffEvent, mockApplyBuffStackEvent, mockCastEvent, mockRemoveBuffEvent} from '__mocks__/Events'
import {Event} from 'events'

let events: Event[] = []

const data = new MockedData()

const mockActionEvent: Ability = {
	guid: 1,
	name: 'Ability 1',
	abilityIcon: '',
	type: AbilityType.SPECIAL,
}
const mockActionData = {
	id: 1,
	name: 'Ability 1',
	icon: '',
	statusesApplied: ['Status 1'],
}
data.mockAction(mockActionData)
const mockActionStackEvent: Ability = {
	guid: 2,
	name: 'Ability 2',
	abilityIcon: '',
	type: AbilityType.SPECIAL,
}
const mockActionStackData = {
	id: 2,
	name: 'Ability 2',
	icon: '',
	statusesApplied: ['Status 2'],
}
data.mockAction(mockActionStackData)

const mockStatusEvent: Ability = {
	guid: 1000001,
	name: 'Status 1',
	abilityIcon: '',
	type: AbilityType.SPECIAL,
}
const mockStatusData = {
	id: 1,
	name: 'Status 1',
	icon: '',
}
data.mockStatus(mockStatusData)

const mockStatusStackEvent: Ability = {
	guid: 1000002,
	name: 'Status 2',
	abilityIcon: '',
	type: AbilityType.SPECIAL,
}
const mockStatusStackData = {
	id: 2,
	name: 'Status 2',
	icon: '',
	stacksApplied: 3,
}
data.mockStatus(mockStatusStackData)
// endregion

// endregion

// endregion


describe('The PrecastStatus module', () => {
	beforeEach(() => {
		parser = new MockedParser()
		Object.defineProperty(parser, 'fight', {value: {start_time: 0}})
		Object.defineProperty(parser, 'modules', {value: {data}})

		precastStatus = new PrecastStatus(parser)
		jest.spyOn(data, 'getAction')
		jest.spyOn(data, 'getActionAppliedByStatus')
		jest.spyOn(data, 'getStatus')
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('has a normalise method', () => {
		expect(precastStatus).toHaveProperty('normalise')
	})

	describe('when an apply buff event on a single target has a matching cast event first', () => {
		beforeEach(() => {
			events = [
				mockCastEvent(50, mockActionEvent),
				mockApplyBuffEvent(100, mockStatusEvent, 1),
				mockRemoveBuffEvent(1100, mockStatusEvent, 1),
			]

			precastStatus.normalise(events)
		})

		it('looks up the action', () => {
			expect(data.getAction).toBeCalledWith(1).toHaveBeenCalledTimes(1)
		})

		it('marks the action as tracked', () => {
			expect(precastStatus.trackedActions).toContain(1)
		})

		it('looks up the status', () => {
			expect(data.getStatus).toBeCalledWith(1000001).toHaveBeenCalledTimes(1)
		})

		it('marks the status as tracked for the target', () => {
			expect(precastStatus.trackedStatuses.get(1)).toContain(1000001)
		})

		it('does not fabricate a cast event', () => {
			expect(precastStatus.castEventsToSynth).toHaveLength(0)
		})

		it('does not fabricate a buff event', () => {
			expect(precastStatus.buffEventsToSynth).toHaveLength(0)
		})
	})

	describe('when an apply buff event on a single target does not have a matching cast event first', () => {
		beforeEach(() => {
			events = [
				mockApplyBuffEvent(100, mockStatusEvent, 1),
				mockRemoveBuffEvent(1100, mockStatusEvent, 1),
			]

			precastStatus.normalise(events)
		})

		it('looks up the status', () => {
			expect(data.getStatus).toBeCalledWith(1000001).toHaveBeenCalledTimes(1)
		})

		it('marks the status as tracked for the target', () => {
			expect(precastStatus.trackedStatuses.get(1)).toContain(1000001)
		})

		it('looks up the action', () => {
			expect(data.getActionAppliedByStatus).toBeCalledWith(jasmine.objectContaining(mockStatusData)).toHaveBeenCalledTimes(1)
		})

		it('fabricates a cast event', () => {
			expect(precastStatus.castEventsToSynth).toHaveLength(1)
		})

		it('marks the action as tracked', () => {
			expect(precastStatus.trackedActions).toContain(1)
		})

		it('does not fabricate a buff event', () => {
			expect(precastStatus.buffEventsToSynth).toHaveLength(0)
		})
	})

	describe('when a remove buff event on a single target does not have a matching apply buff or cast event first', () => {
		beforeEach(() => {
			events = [
				mockRemoveBuffEvent(1100, mockStatusEvent, 1),
			]

			precastStatus.normalise(events)
		})

		it('looks up the status', () => {
			expect(data.getStatus).toBeCalledWith(1000001).toHaveBeenCalledTimes(1)
		})

		it('fabricates a buff event', () => {
			expect(precastStatus.buffEventsToSynth).toHaveLength(1)
		})

		it('marks the status as tracked for the target', () => {
			expect(precastStatus.trackedStatuses.get(1)).toContain(1000001)
		})

		it('looks up the action', () => {
			expect(data.getActionAppliedByStatus).toBeCalledWith(jasmine.objectContaining(mockStatusData)).toHaveBeenCalledTimes(1)
		})

		it('fabricates a cast event', () => {
			expect(precastStatus.castEventsToSynth).toHaveLength(1)
		})

		it('marks the action as tracked', () => {
			expect(precastStatus.trackedActions).toContain(1)
		})
	})

	describe('when apply buff events on eight targets has a matching cast event first', () => {
		beforeEach(() => {
			events = [
				mockCastEvent(50, mockActionEvent),
				mockApplyBuffEvent(100, mockStatusEvent, 1),
				mockApplyBuffEvent(100, mockStatusEvent, 2),
				mockApplyBuffEvent(100, mockStatusEvent, 3),
				mockApplyBuffEvent(100, mockStatusEvent, 4),
				mockApplyBuffEvent(100, mockStatusEvent, 5),
				mockApplyBuffEvent(100, mockStatusEvent, 6),
				mockApplyBuffEvent(100, mockStatusEvent, 7),
				mockApplyBuffEvent(100, mockStatusEvent, 8),
				mockRemoveBuffEvent(1100, mockStatusEvent, 1),
				mockRemoveBuffEvent(1100, mockStatusEvent, 2),
				mockRemoveBuffEvent(1100, mockStatusEvent, 3),
				mockRemoveBuffEvent(1100, mockStatusEvent, 4),
				mockRemoveBuffEvent(1100, mockStatusEvent, 5),
				mockRemoveBuffEvent(1100, mockStatusEvent, 6),
				mockRemoveBuffEvent(1100, mockStatusEvent, 7),
				mockRemoveBuffEvent(1100, mockStatusEvent, 8),
			]

			precastStatus.normalise(events)
		})

		it('looks up the action', () => {
			expect(data.getAction).toBeCalledWith(1).toHaveBeenCalledTimes(1)
		})

		it('marks the action as tracked', () => {
			expect(precastStatus.trackedActions).toContain(1)
		})

		it('looks up the status for each target', () => {
			expect(data.getStatus).toBeCalledWith(1000001).toHaveBeenCalledTimes(8)
		})

		it('marks the status as tracked for each target', () => {
			expect(precastStatus.trackedStatuses.get(1)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(2)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(3)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(4)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(5)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(6)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(7)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(8)).toContain(1000001)
		})

		it('does not fabricate a cast event', () => {
			expect(precastStatus.castEventsToSynth).toHaveLength(0)
		})

		it('does not fabricate any buff events', () => {
			expect(precastStatus.buffEventsToSynth).toHaveLength(0)
		})
	})

	describe('when apply buff events on eight targets do not have a matching cast event first', () => {
		beforeEach(() => {
			events = [
				mockApplyBuffEvent(100, mockStatusEvent, 1),
				mockApplyBuffEvent(100, mockStatusEvent, 2),
				mockApplyBuffEvent(100, mockStatusEvent, 3),
				mockApplyBuffEvent(100, mockStatusEvent, 4),
				mockApplyBuffEvent(100, mockStatusEvent, 5),
				mockApplyBuffEvent(100, mockStatusEvent, 6),
				mockApplyBuffEvent(100, mockStatusEvent, 7),
				mockApplyBuffEvent(100, mockStatusEvent, 8),
				mockRemoveBuffEvent(1100, mockStatusEvent, 1),
				mockRemoveBuffEvent(1100, mockStatusEvent, 2),
				mockRemoveBuffEvent(1100, mockStatusEvent, 3),
				mockRemoveBuffEvent(1100, mockStatusEvent, 4),
				mockRemoveBuffEvent(1100, mockStatusEvent, 5),
				mockRemoveBuffEvent(1100, mockStatusEvent, 6),
				mockRemoveBuffEvent(1100, mockStatusEvent, 7),
				mockRemoveBuffEvent(1100, mockStatusEvent, 8),
			]

			precastStatus.normalise(events)
		})

		it('looks up the status for each target', () => {
			expect(data.getStatus).toBeCalledWith(1000001).toHaveBeenCalledTimes(8)
		})

		it('marks the status as tracked for each target', () => {
			expect(precastStatus.trackedStatuses.get(1)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(2)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(3)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(4)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(5)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(6)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(7)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(8)).toContain(1000001)
		})

		it('looks up the action for each buff event', () => {
			expect(data.getActionAppliedByStatus).toBeCalledWith(jasmine.objectContaining(mockStatusData)).toHaveBeenCalledTimes(8)
		})

		it('fabricates a single cast event', () => {
			expect(precastStatus.castEventsToSynth).toHaveLength(1)
		})

		it('marks the action as tracked', () => {
			expect(precastStatus.trackedActions).toContain(1)
		})

		it('does not fabricate any buff events', () => {
			expect(precastStatus.buffEventsToSynth).toHaveLength(0)
		})
	})

	describe('when remove buff events on eight targets do not have matching apply buff or cast events first', () => {
		beforeEach(() => {
			events = [
				mockRemoveBuffEvent(1100, mockStatusEvent, 1),
				mockRemoveBuffEvent(1100, mockStatusEvent, 2),
				mockRemoveBuffEvent(1100, mockStatusEvent, 3),
				mockRemoveBuffEvent(1100, mockStatusEvent, 4),
				mockRemoveBuffEvent(1100, mockStatusEvent, 5),
				mockRemoveBuffEvent(1100, mockStatusEvent, 6),
				mockRemoveBuffEvent(1100, mockStatusEvent, 7),
				mockRemoveBuffEvent(1100, mockStatusEvent, 8),
			]

			precastStatus.normalise(events)
		})

		it('looks up the status for each target', () => {
			expect(data.getStatus).toBeCalledWith(1000001).toHaveBeenCalledTimes(8)
		})

		it('fabricates an apply buff event for each target', () => {
			expect(precastStatus.buffEventsToSynth).toHaveLength(8)
		})

		it('marks the status as tracked for each target', () => {
			expect(precastStatus.trackedStatuses.get(1)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(2)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(3)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(4)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(5)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(6)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(7)).toContain(1000001)
			expect(precastStatus.trackedStatuses.get(8)).toContain(1000001)
		})

		it('looks up the action for each buff event', () => {
			expect(data.getActionAppliedByStatus).toBeCalledWith(jasmine.objectContaining(mockStatusData)).toHaveBeenCalledTimes(8)
		})

		it('fabricates a single cast event', () => {
			expect(precastStatus.castEventsToSynth).toHaveLength(1)
		})

		it('marks the action as tracked', () => {
			expect(precastStatus.trackedActions).toContain(1)
		})
	})

	describe('when an apply buff stack event on a single target has the maximum number of stacks and a matching cast event first', () => {
		beforeEach(() => {
			events = [
				mockCastEvent(50, mockActionStackEvent),
				mockApplyBuffEvent(100, mockStatusStackEvent, 1),
				mockApplyBuffStackEvent(100, mockStatusStackEvent, 1, 3),
				mockRemoveBuffEvent(1100, mockStatusStackEvent, 1),
			]

			precastStatus.normalise(events)
		})

		it('looks up the action', () => {
			expect(data.getAction).toBeCalledWith(2).toHaveBeenCalledTimes(1)
		})

		it('marks the action as tracked', () => {
			expect(precastStatus.trackedActions).toContain(2)
		})

		it('looks up the status', () => {
			expect(data.getStatus).toBeCalledWith(1000002).toHaveBeenCalledTimes(2)
		})

		it('marks the status as tracked for the target', () => {
			expect(precastStatus.trackedStatuses.get(1)).toContain(1000002)
		})

		it('does not fabricate a cast event', () => {
			expect(precastStatus.castEventsToSynth).toHaveLength(0)
		})

		it('does not fabricate a buff event', () => {
			expect(precastStatus.buffEventsToSynth).toHaveLength(0)
		})
	})

	describe('when an apply buff stack event on a single target has the maximum number of stacks and does not have a matching cast event first', () => {
		beforeEach(() => {
			events = [
				mockApplyBuffEvent(100, mockStatusStackEvent, 1),
				mockApplyBuffStackEvent(100, mockStatusStackEvent, 1, 3),
				mockRemoveBuffEvent(1100, mockStatusStackEvent, 1),
			]

			precastStatus.normalise(events)
		})

		it('looks up the status', () => {
			expect(data.getStatus).toBeCalledWith(1000002).toHaveBeenCalledTimes(2)
		})

		it('marks the status as tracked for the target', () => {
			expect(precastStatus.trackedStatuses.get(1)).toContain(1000002)
		})

		it('looks up the action', () => {
			expect(data.getActionAppliedByStatus).toBeCalledWith(jasmine.objectContaining(mockStatusStackData)).toHaveBeenCalledTimes(1)
		})

		it('fabricates a cast event', () => {
			expect(precastStatus.castEventsToSynth).toHaveLength(1)
		})

		it('marks the action as tracked', () => {
			expect(precastStatus.trackedActions).toContain(2)
		})

		it('does not fabricate a buff event', () => {
			expect(precastStatus.buffEventsToSynth).toHaveLength(0)
		})
	})

	describe('when an apply buff stack event on a single target has less than the maximum number of stacks and does not have a matching cast event first', () => {
		beforeEach(() => {
			events = [
				mockApplyBuffEvent(100, mockStatusStackEvent, 1),
				mockApplyBuffStackEvent(100, mockStatusStackEvent, 1, 2),
				mockRemoveBuffEvent(1100, mockStatusStackEvent, 1),
			]

			precastStatus.normalise(events)
		})

		it('looks up the status', () => {
			expect(data.getStatus).toBeCalledWith(1000002).toHaveBeenCalledTimes(2)
		})

		it('marks the status as tracked for the target', () => {
			expect(precastStatus.trackedStatuses.get(1)).toContain(1000002)
		})

		it('looks up the action', () => {
			expect(data.getActionAppliedByStatus).toBeCalledWith(jasmine.objectContaining(mockStatusStackData)).toHaveBeenCalledTimes(1)
		})

		it('fabricates a cast event', () => {
			expect(precastStatus.castEventsToSynth).toHaveLength(1)
		})

		it('marks the action as tracked', () => {
			expect(precastStatus.trackedActions).toContain(2)
		})

		it('fabricates a buff event and an applybuff event with max stacks', () => {
			expect(precastStatus.buffEventsToSynth).toHaveLength(2)
		})
	})
})
