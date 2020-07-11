import {Ability, BuffEvent, BuffStackEvent, CastEvent} from 'fflogs'

export const mockCastEvent = (timestamp: number, ability: Ability): CastEvent => ({
	type: 'cast',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: false,
})

export const mockApplyBuffEvent = (timestamp: number, ability: Ability, targetID: number): BuffEvent => ({
	type: 'applybuff',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: true,
	targetID,
})

export const mockApplyBuffStackEvent = (timestamp: number, ability: Ability, targetID: number, stack: number): BuffStackEvent => ({
	type: 'applybuffstack',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: true,
	stack,
	targetID,
})

export const mockRemoveBuffEvent = (timestamp: number, ability: Ability, targetID: number): BuffEvent => ({
	type: 'removebuff',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: true,
	targetID,
})

export const mockRemoveBuffStackEvent = (timestamp: number, ability: Ability, stack: number, targetID: number): BuffStackEvent => ({
	type: 'removebuffstack',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: true,
	stack,
	targetID,
})

export const mockRefreshBuffEvent = (timestamp: number, ability: Ability, targetID: number): BuffEvent => ({
	type: 'refreshbuff',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: true,
	targetID,
})

