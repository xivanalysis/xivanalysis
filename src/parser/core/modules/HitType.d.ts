import Module from 'parser/core/Module'

declare module 'fflogs' {
	interface DamageEvent {
		criticalHit: boolean
		directHit: boolean
		successfulHit: boolean
	}

	interface HealEvent {
		criticalHit: boolean
		directHit: boolean
		successfulHit: boolean
	}
}

export default class HitType extends Module {}
