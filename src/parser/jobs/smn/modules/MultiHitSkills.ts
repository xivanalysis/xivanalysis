import {AoEUsages} from 'parser/core/modules/AoEUsages'

export class AoeChecker extends AoEUsages {
	suggestionIcon = this.data.actions.TRI_DISASTER.icon

	trackedActions = [
		{
			aoeAction: this.data.actions.TRI_DISASTER,
			stActions: [this.data.actions.RUIN_III],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.ENERGY_SIPHON,
			stActions: [this.data.actions.SMN_ENERGY_DRAIN],
			minTargets: 2,
		},
		{
			aoeAction: this.data.actions.PAINFLARE,
			stActions: [this.data.actions.NECROTIZE],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.ASTRAL_FLARE,
			stActions: [this.data.actions.ASTRAL_IMPULSE],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.BRAND_OF_PURGATORY,
			stActions: [this.data.actions.FOUNTAIN_OF_FIRE],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.UMBRAL_FLARE,
			stActions: [this.data.actions.UMBRAL_IMPULSE],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.RUBY_CATASTROPHE,
			stActions: [this.data.actions.RUBY_RITE],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.TOPAZ_CATASTROPHE,
			stActions: [this.data.actions.TOPAZ_RITE],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.EMERALD_CATASTROPHE,
			stActions: [this.data.actions.EMERALD_RITE],
			minTargets: 3,
		},
	]
}
