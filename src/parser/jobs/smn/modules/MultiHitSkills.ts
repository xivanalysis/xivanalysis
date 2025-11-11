import {AoEUsages} from 'parser/core/modules/AoEUsages'

const PF_BP_71 = 3
const PF_BP_72 = 4

// Ruin 3 was boosted from 360p to 400p in 7.3, so it now takes 4 targets before Tri Disaster wins out
const TD_BEFORE_73 = 3
const TD_AFTER_73 = 4

export class AoeChecker extends AoEUsages {
	suggestionIcon = this.data.actions.TRI_DISASTER.icon

	trackedActions = [
		{
			aoeAction: this.data.actions.TRI_DISASTER,
			stActions: [this.data.actions.RUIN_III],
			minTargets: this.parser.patch.before('7.3') ? TD_BEFORE_73 : TD_AFTER_73,
		},
		{
			aoeAction: this.data.actions.ENERGY_SIPHON,
			stActions: [this.data.actions.SMN_ENERGY_DRAIN],
			minTargets: 2,
		},
		{
			aoeAction: this.data.actions.PAINFLARE,
			stActions: [this.data.actions.NECROTIZE],
			minTargets: (!this.parser.patch.before('7.2')) ? PF_BP_71 : PF_BP_72,
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
