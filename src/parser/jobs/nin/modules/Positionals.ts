import {PotencyModifier, Positionals as CorePositionals} from 'parser/core/modules/Positionals'

const ARMOR_CRUSH_COMBO_POTENCY_600 = 340
const ARMOR_CRUSH_COMBO_POTENCY_610 = 360
const AEOLIAN_EDGE_COMBO_POTENCY_600 = 360
const AEOLIAN_EDGE_COMBO_POTENCY_610 = 380

export class Positionals extends CorePositionals {
	positionals = [{
		action: this.data.actions.ARMOR_CRUSH,
		potencies: [
			{
				value: 140,
				modifiers: [],
			},
			{
				value: this.parser.patch.before('6.1') ? ARMOR_CRUSH_COMBO_POTENCY_600 : ARMOR_CRUSH_COMBO_POTENCY_610,
				modifiers: [PotencyModifier.COMBO],
			},
		],
	},
	{
		action: this.data.actions.TRICK_ATTACK,
	},
	{
		action: this.data.actions.AEOLIAN_EDGE,
		potencies: [
			{
				value: 140,
				modifiers: [],
			},
			{
				value: this.parser.patch.before('6.1') ? AEOLIAN_EDGE_COMBO_POTENCY_600 : AEOLIAN_EDGE_COMBO_POTENCY_610,
				modifiers: [PotencyModifier.COMBO],
			},
		],
	},
	]
}
