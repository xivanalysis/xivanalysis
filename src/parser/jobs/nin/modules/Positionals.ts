import {PotencyModifier, Positionals as CorePositionals} from 'parser/core/modules/Positionals'

/* eslint-disable @typescript-eslint/no-magic-numbers */
const ARMOR_CRUSH_BASE_POTENCY = 140
const ARMOR_CRUSH_COMBO_POTENCY_6_0 = 340
const ARMOR_CRUSH_COMBO_POTENCY_6_1 = 360
const AEOLIAN_EDGE_BASE_POTENCY = 140
const AEOLIAN_EDGE_COMBO_POTENCY_6_0 = 360
const AEOLIAN_EDGE_COMBO_POTENCY_6_1 = 380
/* eslint-enable @typescript-eslint/no-magic-numbers */

export class Positionals extends CorePositionals {
	positionals = [{
		action: this.data.actions.ARMOR_CRUSH,
		potencies: [
			{
				value: ARMOR_CRUSH_BASE_POTENCY,
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
				value: AEOLIAN_EDGE_BASE_POTENCY,
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
