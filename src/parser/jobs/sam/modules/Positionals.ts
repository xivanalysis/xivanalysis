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
				value: this.data.actions.GEKKO.potency,
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
				value: this.data.actions.KASHA.potency,
				modifiers: [PotencyModifier.COMBO],
			},
		],
	},
	]
}
