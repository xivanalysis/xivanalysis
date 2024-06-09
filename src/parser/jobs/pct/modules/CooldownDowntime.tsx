import {CooldownDowntime as CoreCooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// Subtractive Palette not tracked here because it has a gauge cost associated with it
// TODO: First use offsets?

export class CooldownDowntime extends CoreCooldownDowntime {
	trackedCds = [
		{
			cooldowns: [
				this.data.actions.CREATURE_MOTIF,
				this.data.actions.POM_MOTIF,
				this.data.actions.WING_MOTIF,
				this.data.actions.CLAW_MOTIF,
				this.data.actions.MAW_MOTIF,
			],
		},
		{
			cooldowns: [
				this.data.actions.WEAPON_MOTIF,
				this.data.actions.STEEL_MUSE,
			],
		},
		{
			cooldowns: [
				this.data.actions.LANDSCAPE_MOTIF,
				this.data.actions.STARRY_SKY_MOTIF,
			],
		},
		{
			cooldowns: [
				this.data.actions.MOG_OF_THE_AGES,
				this.data.actions.RETRIBUTION_OF_THE_MADEEN,
			],
		},
	]
}
