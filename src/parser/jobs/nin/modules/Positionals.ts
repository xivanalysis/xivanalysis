import {PotencyModifier, Positionals as CorePositionals} from 'parser/core/modules/Positionals'

export class Positionals extends CorePositionals {
	positionals = [{
		action: this.data.actions.ARMOR_CRUSH,
		potencies: [
			{
				value: 140,
				modifiers: [],
			},
			{
				value: 340,
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
				value: 360,
				modifiers: [PotencyModifier.COMBO],
			},
		],
	},
	]
}
