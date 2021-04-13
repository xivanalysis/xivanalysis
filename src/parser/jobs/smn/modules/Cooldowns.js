import CoreCooldowns from 'parser/core/modules/Cooldowns'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		{
			name: 'Energy Drain/Siphon',
			actions: [
				'ENERGY_DRAIN',
				'ENERGY_SIPHON',
			],
		},
		'FESTER',
		'PAINFLARE',
		'BANE',
		{
			name: 'Trance',
			actions: [
				'DREADWYRM_TRANCE',
				'FIREBIRD_TRANCE',
			],
		},
		'DEATHFLARE',
		'SUMMON_BAHAMUT',
		'ENKINDLE_BAHAMUT',
		'ENKINDLE_PHOENIX',
		{
			name: 'Summon',
			actions: [
				'SUMMON',
				'SUMMON_II',
				'SUMMON_III',
			],
		},
		{
			name: 'Assault I',
			actions: [
				'ASSAULT_I_AERIAL_SLASH',
				'ASSAULT_I_EARTHEN_ARMOR',
				'ASSAULT_I_CRIMSON_CYCLONE',
			],
		},
		{
			name: 'Assault II',
			actions: [
				'ASSAULT_II_SLIIPSTREAM',
				'ASSAULT_II_MOUNTAIN_BUSTER',
				'ASSAULT_II_FLAMING_CRUSH',
			],
		},
		{
			name: 'Enkindle',
			actions: [
				'ENKINDLE_AERIAL_BLAST',
				'ENKINDLE_EARTHEN_FURY',
				'ENKINDLE_INFERNO',
			],
		},
		'SMN_AETHERPACT',
		'TRI_DISASTER',
	]
}
