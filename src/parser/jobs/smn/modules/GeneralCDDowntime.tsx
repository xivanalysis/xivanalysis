import {Trans} from '@lingui/react'
import ACTIONS from 'data/ACTIONS'
import {AbilityType, CastEvent} from 'fflogs'
import {dependency} from 'parser/core/Module'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import PrecastStatus from 'parser/core/modules/PrecastStatus'
import React from 'react'
import {Event} from 'events'

export default class GeneralCDDowntime extends CooldownDowntime {
	// Need dependency to ensure proper ordering of normalise calls
	@dependency private precastStatus!: PrecastStatus

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

	normalise(events: Event[]) {
		// Egis will not execute an order while they are moving, so it is possible to
		// issue a pre-pull Aetherpact and delay the Devotion cast by the pet until
		// after the pull by running the pet in circles.  Such casts will not be detected
		// by PrecastStatus, since the status is applied post-pull.

		for (const event of events) {
			if (event.type !== 'cast') { continue }

			const cast = event as CastEvent
			if (!cast.ability ||
				!(this.parser.byPlayer(cast) || this.parser.byPlayerPet(cast))
			) {
				continue
			}

			if (cast.ability.guid === ACTIONS.SMN_AETHERPACT.id) {
				this.debug('Aetherpact found first')
				// Aetherpact was found first, everything is in order
				return events
			} else if (cast.ability.guid === ACTIONS.DEVOTION.id) {
				this.debug('Devotion found first')
				// Devotion was found first, need to synth an Aetherpact
				const preCast: CastEvent = {
					ability: {
						abilityIcon: ACTIONS.SMN_AETHERPACT.icon,
						guid: ACTIONS.SMN_AETHERPACT.id,
						name: ACTIONS.SMN_AETHERPACT.name,
						type: AbilityType.SPECIAL,
					},
					sourceID: this.parser.player.id,
					sourceIsFriendly: true,
					target: cast.source,
					targetID: cast.sourceID,
					targetInstance: cast.sourceInstance,
					targetIsFriendly: cast.sourceIsFriendly,
					timestamp: this.parser.fight.start_time - 2,
					type: 'cast',
				}
				events.splice(0, 0, preCast)
				return events
			}
		}

		return events
	}
}
