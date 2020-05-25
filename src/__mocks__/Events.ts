import {Ability, BuffEvent, BuffStackEvent, CastEvent} from 'fflogs'

export const mockCastEvent = (timestamp: number, ability: Ability): CastEvent => ({
	type: 'cast',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: false,
})

export const mockApplyBuffEvent = (timestamp: number, ability: Ability): BuffEvent => ({
	type: 'applybuff',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: true,
})

export const mockApplyBuffStackEvent = (timestamp: number, ability: Ability, stack: number): BuffStackEvent => ({
	type: 'applybuffstack',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: true,
	stack,
})

export const mockRemoveBuffEvent = (timestamp: number, ability: Ability): BuffEvent => ({
	type: 'removebuff',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: true,
})

export const mockRemoveBuffStackEvent = (timestamp: number, ability: Ability, stack: number): BuffStackEvent => ({
	type: 'removebuffstack',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: true,
	stack,
})

export const mockRefreshBuffEvent = (timestamp: number, ability: Ability): BuffEvent => ({
	type: 'refreshbuff',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: true,
})

