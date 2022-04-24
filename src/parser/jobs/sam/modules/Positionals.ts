import {PotencyModifier, Positionals as CorePositionals} from 'parser/core/modules/Positionals'

const PATCH6 = 100
const PATCH61 = 120
export class Positionals extends CorePositionals {
	positionals = [{
		action: this.data.actions.GEKKO,
		potencies: [
			{
				value: (this.parser.patch.before('6.1')) ? PATCH6 : PATCH61,
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
				value: (this.parser.patch.before('6.1')) ? PATCH6 : PATCH61,
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
