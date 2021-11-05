import {Events, SourceModifier, TargetModifier} from 'event'

export function isSuccessfulHit(event: Events['damage']): boolean {
	return event.targets.some(t => t.sourceModifier !== SourceModifier.MISS && t.targetModifier !== TargetModifier.INVULNERABLE)
}
