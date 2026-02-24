import {AoEUsages as CoreAoE} from 'parser/core/modules/AoEUsages'

export class AoEUsages extends CoreAoE {
	suggestionIcon = this.data.actions.DYSKRASIA_II.icon

	trackedActions = [
		// Regular Dyskrasia has niche use as a "keep some amount of damage going while handling movement" tool,
		// so warning against its use here below a target threshold is not included.
		{
			aoeAction: this.data.actions.EUKRASIAN_DYSKRASIA,
			stActions: [this.data.actions.EUKRASIAN_DOSIS_III],
			minTargets: 3,
		},
	]
}
