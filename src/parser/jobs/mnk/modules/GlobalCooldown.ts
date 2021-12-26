import {GlobalCooldown as CoreGlobalCooldown} from 'parser/core/modules/GlobalCooldown'

export class GlobalCooldown extends CoreGlobalCooldown {

	override getEstimate(): number {
		// TODO: Somehow apply Greased Lighting passive on estimate
		return super.getEstimate()
	}
}
