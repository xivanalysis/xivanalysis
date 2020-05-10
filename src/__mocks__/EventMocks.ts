import {Ability, CastEvent, DamageEvent, HitType} from 'fflogs'

export const mockBeginCastEvent = (timestamp: number, ability: Ability): CastEvent => ({
	...mockCastEvent(timestamp, ability),
	type: 'begincast',
})

export const mockCastEvent = (timestamp: number, ability: Ability): CastEvent => ({
	type: 'cast',
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: false,
})

export const mockDamageEvent = (timestamp: number, ability: Ability): DamageEvent => ({
	type: 'damage',
	absorbed: 0,
	criticalHit: false,
	directHit: false,
	successfulHit: true,
	hitType: HitType.NORMAL,
	amount: 0,
	targetResources: {
		hitPoints: 0,
		maxHitPoints: 0,
		mp: 0,
		maxMP: 0,
		tp: 0,
		maxTP: 0,
		x: 0,
		y: 0,
	},
	timestamp,
	ability,
	sourceIsFriendly: true,
	targetIsFriendly: false,
})
