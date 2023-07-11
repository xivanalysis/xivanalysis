import {AoEUsages as CoreAoE} from 'parser/core/modules/AoEUsages'

export class AoEUsages extends CoreAoE {
	suggestionIcon = this.data.actions.FOUL.icon

	trackedActions = [
		{
			aoeAction: this.data.actions.FOUL,
			stActions: [this.data.actions.XENOGLOSSY],
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			minTargets: this.parser.patch.before('6.4') ? 2 : 3,
		},
		{
			aoeAction: this.data.actions.FLARE,
			stActions: [this.data.actions.DESPAIR],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.THUNDER_IV,
			stActions: [this.data.actions.THUNDER_III],
			minTargets: 2,
		},
		{
			aoeAction: this.data.actions.BLIZZARD_II,
			stActions: [this.data.actions.BLIZZARD_III],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.HIGH_BLIZZARD_II,
			stActions: [this.data.actions.BLIZZARD_III],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.FIRE_II,
			stActions: [this.data.actions.FIRE_III, this.data.actions.FIRE_IV],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.HIGH_FIRE_II,
			stActions: [this.data.actions.FIRE_III, this.data.actions.FIRE_IV],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.FREEZE,
			stActions: [this.data.actions.BLIZZARD_IV],
			minTargets: 3,
		},
	]
}
