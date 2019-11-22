import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

const DEFAULT_ALLOWED_DOWNTIME = 4000
// Although the trance cooldown is 55s, it is better in many cases
// to hold for a 60s alignment, so some downtime per use must be allowed.
const TRANCE_ALLOWED_DOWNTIME = 5000

export default class GeneralCDDowntime extends CooldownDowntime {
	defaultAllowedAverageDowntime = DEFAULT_ALLOWED_DOWNTIME
	trackedCds = [
		{
			cooldowns: [ACTIONS.DREADWYRM_TRANCE, ACTIONS.FIREBIRD_TRANCE],
			allowedAverageDowntime: TRANCE_ALLOWED_DOWNTIME,
		},
		{cooldowns: [
			ACTIONS.ENERGY_DRAIN,
			ACTIONS.ENERGY_SIPHON,
		]},
		{cooldowns: [
			ACTIONS.ASSAULT_I_AERIAL_SLASH,
			ACTIONS.ASSAULT_I_EARTHEN_ARMOR,
			ACTIONS.ASSAULT_I_CRIMSON_CYCLONE,
		]},
		{cooldowns: [
			ACTIONS.ASSAULT_II_SLIIPSTREAM,
			ACTIONS.ASSAULT_II_MOUNTAIN_BUSTER,
			ACTIONS.ASSAULT_II_FLAMING_CRUSH,
		]},
		{cooldowns: [
			ACTIONS.ENKINDLE_AERIAL_BLAST,
			ACTIONS.ENKINDLE_EARTHEN_FURY,
			ACTIONS.ENKINDLE_INFERNO,
		]},
		{cooldowns: [ACTIONS.SMN_AETHERPACT]},
	]

}
