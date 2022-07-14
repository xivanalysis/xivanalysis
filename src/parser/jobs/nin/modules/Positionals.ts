import {PotencyModifier, Positionals as CorePositionals} from 'parser/core/modules/Positionals'

const ARMOR_CRUSH_COMBO_POTENCY_6_0 = 340
const ARMOR_CRUSH_COMBO_POTENCY_6_1 = 360
const AEOLIAN_EDGE_COMBO_POTENCY_6_0 = 360
const AEOLIAN_EDGE_COMBO_POTENCY_6_1 = 380

export class Positionals extends CorePositionals {
	positionals = [{
		action: this.data.actions.ARMOR_CRUSH,
		potencies: [
			{
				value: this.data.actions.ARMOR_CRUSH.potency,
				modifiers: [],
			},
			{
				value: this.parser.patch.before('6.1') ? ARMOR_CRUSH_COMBO_POTENCY_6_0 : ARMOR_CRUSH_COMBO_POTENCY_6_1,
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
				value: this.data.actions.AEOLIAN_EDGE.potency,
				modifiers: [],
			},
			{
				value: this.parser.patch.before('6.1') ? AEOLIAN_EDGE_COMBO_POTENCY_6_0 : AEOLIAN_EDGE_COMBO_POTENCY_6_1,
				modifiers: [PotencyModifier.COMBO],
			},
		],
	},
	]
}
