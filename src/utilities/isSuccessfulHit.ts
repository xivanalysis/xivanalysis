import {Events, SourceModifier, TargetModifier} from 'event'

export function isSuccessfulHit(event: Events['damage']): boolean {
	return !(event.sourceModifier === SourceModifier.MISS || event.targetModifier === TargetModifier.INVULNERABLE)
}
