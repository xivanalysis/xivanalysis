import CoreCooldowns from 'parser/core/modules/Cooldowns'
import ACTIONS from 'data/ACTIONS'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		{
			name: 'Energy Drain/Siphon',
			merge: true,
			actions: [
				ACTIONS.ENERGY_DRAIN.id,
				ACTIONS.ENERGY_SIPHON.id,
			],
		},
		ACTIONS.FESTER.id,
		ACTIONS.PAINFLARE.id,
		ACTIONS.BANE.id,
		{
			name: 'Trance',
			merge: true,
			actions: [
				ACTIONS.DREADWYRM_TRANCE.id,
				ACTIONS.FIREBIRD_TRANCE.id,
			],
		},
		ACTIONS.DEATHFLARE.id,
		ACTIONS.SUMMON_BAHAMUT.id,
		ACTIONS.ENKINDLE_BAHAMUT.id,
		ACTIONS.ENKINDLE_PHOENIX.id,
		{
			name: 'Summon',
			merge: true,
			actions: [
				ACTIONS.SUMMON.id,
				ACTIONS.SUMMON_II.id,
				ACTIONS.SUMMON_III.id,
			],
		},
		{
			name: 'Assault I',
			merge: true,
			actions: [
				ACTIONS.ASSAULT_I_AERIAL_SLASH.id,
				ACTIONS.ASSAULT_I_EARTHEN_ARMOR.id,
				ACTIONS.ASSAULT_I_CRIMSON_CYCLONE.id,
			],
		},
		{
			name: 'Assault II',
			merge: true,
			actions: [
				ACTIONS.ASSAULT_II_SLIIPSTREAM.id,
				ACTIONS.ASSAULT_II_MOUNTAIN_BUSTER.id,
				ACTIONS.ASSAULT_II_FLAMING_CRUSH.id,
			],
		},
		{
			name: 'Enkindle',
			merge: true,
			actions: [
				ACTIONS.ENKINDLE_AERIAL_BLAST.id,
				ACTIONS.ENKINDLE_EARTHEN_FURY.id,
				ACTIONS.ENKINDLE_INFERNO.id,
			],
		},
		ACTIONS.SMN_AETHERPACT.id,
		ACTIONS.TRI_DISASTER.id,
	]
}
