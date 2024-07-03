import {CooldownDowntime as CoreCooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// Subtractive Palette, Mog, and Madeeon not tracked here because they have gauge requirements to use as well
// TODO: First use offsets?

export class CooldownDowntime extends CoreCooldownDowntime {
	trackedCds = [
		{
			cooldowns: [
				this.data.actions.POM_MUSE,
				this.data.actions.WINGED_MUSE,
				this.data.actions.CLAWED_MUSE,
				this.data.actions.FANGED_MUSE,
			],
		},
		{
			cooldowns: [
				this.data.actions.STRIKING_MUSE,
			],
		},
		{
			cooldowns: [
				this.data.actions.STARRY_MUSE,
			],
		},
	]
}
