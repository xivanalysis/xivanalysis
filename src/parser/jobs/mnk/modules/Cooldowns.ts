import CoreCooldowns, {CooldownOrderItem} from 'parser/core/modules/Cooldowns'

export default class Cooldowns extends CoreCooldowns {
	static override cooldownOrder: CooldownOrderItem[] = [
		{
			name: 'Chakras',
			actions: [
				'THE_FORBIDDEN_CHAKRA',
				'ENLIGHTENMENT',
			],
		},
		{
			name: 'Fists',
			actions: [
				'FISTS_OF_FIRE',
				'FISTS_OF_WIND',
				'FISTS_OF_EARTH',
			],
		},
		'RIDDLE_OF_FIRE',
		'BROTHERHOOD',
		'PERFECT_BALANCE',
		'ELIXIR_FIELD',
		'TORNADO_KICK',
		'SHOULDER_TACKLE',
		'ANATMAN',
		'RIDDLE_OF_EARTH',
		'MANTRA',
	]
}
