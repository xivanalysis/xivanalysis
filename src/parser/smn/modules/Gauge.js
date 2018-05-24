import React, { Fragment } from 'react'

import { ActionLink } from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import PETS from 'data/PETS'
import Module from 'parser/core/Module'
import { Rule, Requirement } from 'parser/core/modules/Checklist'

// Neither act nor fflogs track gauge very well, so let's do it ourselves
export default class Gauge extends Module {
	static dependencies = [
		'checklist',
		'cooldowns',
		'pets'
	]

	// -----
	// Properties
	// -----
	lastSummonBahamut = -1

	// -----
	// API
	// -----
	bahamutSummoned() {
		const pet = this.pets.getCurrentPet()
		return pet && pet.id === PETS.DEMI_BAHAMUT.id
	}

	// -----
	// Event handling
	// -----
	on_cast(event) {
		const abilityId = event.ability.guid

		// DWT resets 3D
		if (abilityId === ACTIONS.DREADWYRM_TRANCE.id) {
			this.cooldowns.resetCooldown(ACTIONS.TRI_DISASTER.id)
		}

		// Summon Bahamut
		// TODO: Reset dreadwyrm aether
	}

	on_complete() {
		// Checklist rule for aetherflow cooldown
		this.checklist.add(new Rule({
			name: <Fragment>Keep <ActionLink {...ACTIONS.AETHERFLOW} />&apos;s cooldown rolling</Fragment>,
			description: 'SMN\'s entire kit revolves around the Aetherflow cooldown. Make sure you squeeze every possible use out of it that you can.',
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.AETHERFLOW} /> cooldown uptime</Fragment>,
					percent: () => (this.cooldowns.getTimeOnCooldown(ACTIONS.AETHERFLOW.id) / this.parser.fightDuration) * 100
				})
			]
		}))
	}
}
