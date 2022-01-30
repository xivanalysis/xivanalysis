import {PotencyModifier, Positionals as CorePositionals} from 'parser/core/modules/Positionals'

export class Positionals extends CorePositionals {
	positionals = [{
		action: this.data.actions.GEKKO,
		potencies: [
			{
				value: 100,
				modifiers: [],
			},
			{
				value: 320,
				modifiers: [PotencyModifier.COMBO],
			},
		],
	},
	{
		action: this.data.actions.KASHA,
		potencies: [
			{
				value: 100,
				modifiers: [],
			},
			{
				value: 320,
				modifiers: [PotencyModifier.COMBO],
			},
		],
	},
	]
}
