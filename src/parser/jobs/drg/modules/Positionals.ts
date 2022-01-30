import {PotencyModifier, Positionals as CorePositionals} from 'parser/core/modules/Positionals'

export class Positionals extends CorePositionals {
	positionals = [{
		action: this.data.actions.CHAOTIC_SPRING,
		potencies: [
			{
				value: 100,
				modifiers: [],
			},
			{
				value: 260,
				modifiers: [PotencyModifier.COMBO],
			},
		],

	},
	{
		action: this.data.actions.WHEELING_THRUST,
	},
	{
		action: this.data.actions.FANG_AND_CLAW,
	},
	]
}
