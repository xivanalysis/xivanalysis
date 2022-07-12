import {PotencyModifier, Positionals as CorePositionals} from 'parser/core/modules/Positionals'

const AEOLIAN_EDGE_BASE_POTENCY = 140
const ARMOR_CRUSH_BASE_POTENCY = 140

export class Positionals extends CorePositionals {
	positionals = [{
		action: this.data.actions.ARMOR_CRUSH,
		potencies: [
			{
				value: AEOLIAN_EDGE_BASE_POTENCY,
				modifiers: [],
			},
			{
				value: this.data.actions.AEOLIAN_EDGE.potency,
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
				value: ARMOR_CRUSH_BASE_POTENCY,
				modifiers: [],
			},
			{
				value: this.data.actions.ARMOR_CRUSH.potency,
				modifiers: [PotencyModifier.COMBO],
			},
		],
	},
	]
}
