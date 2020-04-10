import ACTIONS from 'data/ACTIONS'
import CoreCooldowns from 'parser/core/modules/Cooldowns'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		{
			name: 'Fists',
			merge: true,
			actions: [
				ACTIONS.FISTS_OF_FIRE.id,
				ACTIONS.FISTS_OF_WIND.id,
				ACTIONS.FISTS_OF_EARTH.id,
			],
		},
		ACTIONS.PERFECT_BALANCE.id,
		ACTIONS.RIDDLE_OF_FIRE.id,
		ACTIONS.BROTHERHOOD.id,
		{
			name: 'Chakras',
			merge: true,
			actions: [
				ACTIONS.THE_FORBIDDEN_CHAKRA.id,
				ACTIONS.ENLIGHTENMENT.id,
			],
		},
		ACTIONS.ELIXIR_FIELD.id,
		ACTIONS.SHOULDER_TACKLE.id,
		ACTIONS.TORNADO_KICK.id,
		ACTIONS.RIDDLE_OF_EARTH.id,
		ACTIONS.MANTRA.id,
	]
}
