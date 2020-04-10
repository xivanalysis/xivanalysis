import {Trans} from '@lingui/react'
import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import React from 'react'

export default class GeneralCDDowntime extends CooldownDowntime {
	trackedCds = [ {
		cooldowns: [
			ACTIONS.DREADWYRM_TRANCE,
			ACTIONS.FIREBIRD_TRANCE,
		],
		firstUseOffset: 7500,
	}, {
		cooldowns: [
			ACTIONS.ENERGY_DRAIN,
			ACTIONS.ENERGY_SIPHON,
		],
		firstUseOffset: 2500,
	}, {
		cooldowns: [
			ACTIONS.ASSAULT_I_AERIAL_SLASH,
			ACTIONS.ASSAULT_I_EARTHEN_ARMOR,
			ACTIONS.ASSAULT_I_CRIMSON_CYCLONE,
		],
		firstUseOffset: 3500,
		// isAffectedBySpeed: true,
	}, {
		cooldowns: [
			ACTIONS.ASSAULT_II_SLIIPSTREAM,
			ACTIONS.ASSAULT_II_MOUNTAIN_BUSTER,
			ACTIONS.ASSAULT_II_FLAMING_CRUSH,
		],
		firstUseOffset: 3500,
		// isAffectedBySpeed: true,
	}, {
		cooldowns: [
			ACTIONS.ENKINDLE_AERIAL_BLAST,
			ACTIONS.ENKINDLE_EARTHEN_FURY,
			ACTIONS.ENKINDLE_INFERNO,
		],
		firstUseOffset: 9250,
	}, {
		cooldowns: [
			ACTIONS.SMN_AETHERPACT,
		],
		firstUseOffset: 6750,
	}]

	checklistName = <Trans id="smn.cooldownDowntime.name">Use your cooldowns</Trans>
	checklistDescription = <Trans id="smn.cooldownDowntime.suggestion">Always make sure to use your abilities
		when they are available, but do not clip or delay your GCD to use them.</Trans>
}
