// tslint:disable:no-magic-numbers
import {PrecastStatus} from '../PrecastStatus'
let precastStatus: PrecastStatus

import {MockedParser} from 'parser/core/__tests__/ParserHelper'
import Parser from 'parser/core/Parser'
let parser: Parser

import {MockedData} from 'parser/core/__tests__/DataHelper'
import {mockApplyBuffEvent, mockApplyBuffStackEvent, mockCastEvent, mockRemoveBuffEvent} from 'parser/core/__tests__/EventsHelpers'
import {Event} from 'events'
import {Ability, AbilityType} from 'fflogs'

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

let results: Event[] = []

describe('PrecastStatus', () => {
	beforeEach(() => {
		parser = new MockedParser()
		Object.defineProperty(parser, 'fight', {value: {start_time: 0}})
		Object.defineProperty(parser, 'modules', {value: {data}})

		precastStatus = new PrecastStatus(parser)
	})

	const act = () => { results = precastStatus.normalise(events) }

	describe('when an apply buff event on a single target has a matching cast event first', () => {
		beforeEach(() => {
			events = [
				mockCastEvent(50, mockActionEvent),
				mockApplyBuffEvent(100, mockStatusEvent, 1),
				mockRemoveBuffEvent(1100, mockStatusEvent, 1),
			]
		})

		it('does not fabricate any events', () => {
			act()
			expect(results).toHaveLength(events.length)
		})
	})

	describe('when an apply buff event on a single target does not have a matching cast event first', () => {
		beforeEach(() => {
			events = [
				mockApplyBuffEvent(100, mockStatusEvent, 1),
				mockRemoveBuffEvent(1100, mockStatusEvent, 1),
			]
		})

		it('fabricates a cast event at the beginning of the array', () => {
			act()
			expect(results).toHaveLength(events.length + 1)
			expect(results[0]).toEqual(jasmine.objectContaining({type: 'cast', timestamp: -2, ability: mockActionEvent}))
		})
	})

	describe('when a remove buff event on a single target does not have a matching apply buff or cast event first', () => {
		beforeEach(() => {
			events = [
				mockRemoveBuffEvent(1100, mockStatusEvent, 1),
			]
		})

		it('fabricates cast and applybuff events at the beginning of the array', () => {
			act()
			expect(results).toHaveLength(events.length + 2)
			expect(results[0]).toEqual(jasmine.objectContaining({type: 'cast', timestamp: -2, ability: mockActionEvent}))
			expect(results[1]).toEqual(jasmine.objectContaining({type: 'applybuff', timestamp: -1, ability: mockStatusEvent}))
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
		})

		it('does not fabricate any events', () => {
			act()
			expect(results).toHaveLength(events.length)
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
		})

		it('fabricates a cast event at the beginning of the array', () => {
			act()
			expect(results).toHaveLength(events.length + 1)
			expect(results[0]).toEqual(jasmine.objectContaining({type: 'cast', timestamp: -2, ability: mockActionEvent}))
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

		it('fabricates a cast event plus an applybuff event for each target at the beginning of the array', () => {
			act()
			expect(results).toHaveLength(events.length + 9)
			expect(results[0]).toEqual(jasmine.objectContaining({type: 'cast', timestamp: -2, ability: mockActionEvent}))
			expect(results[1]).toEqual(jasmine.objectContaining({type: 'applybuff', timestamp: -1, ability: mockStatusEvent}))
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
		})

		it('does not fabricate any events', () => {
			act()
			expect(results).toHaveLength(events.length)
		})
	})

	describe('when an apply buff stack event on a single target has the maximum number of stacks and does not have a matching cast event first', () => {
		beforeEach(() => {
			events = [
				mockApplyBuffEvent(100, mockStatusStackEvent, 1),
				mockApplyBuffStackEvent(100, mockStatusStackEvent, 1, 3),
				mockRemoveBuffEvent(1100, mockStatusStackEvent, 1),
			]
		})

		it('fabricates a cast event at the beginning of the array', () => {
			act()
			expect(results).toHaveLength(events.length + 1)
			expect(results[0]).toEqual(jasmine.objectContaining({type: 'cast', timestamp: -2, ability: mockActionStackEvent}))
		})
	})

	describe('when an apply buff stack event on a single target has less than the maximum number of stacks and does not have a matching cast event first', () => {
		beforeEach(() => {
			events = [
				mockApplyBuffEvent(100, mockStatusStackEvent, 1),
				mockApplyBuffStackEvent(100, mockStatusStackEvent, 1, 2),
				mockRemoveBuffEvent(1100, mockStatusStackEvent, 1),
			]
		})

		it('fabricates a cast event, an applybuff event, and an applybuffstack event with maximum stacks at the beginning of the array', () => {
			act()
			expect(results).toHaveLength(events.length + 3)
			expect(results[0]).toEqual(jasmine.objectContaining({type: 'cast', timestamp: -2, ability: mockActionStackEvent}))
			expect(results[1]).toEqual(jasmine.objectContaining({type: 'applybuff', timestamp: -1, ability: mockStatusStackEvent}))
			expect(results[2]).toEqual(jasmine.objectContaining({type: 'applybuffstack', timestamp: -1, ability: mockStatusStackEvent, stack: 3}))
		})
	})
})
