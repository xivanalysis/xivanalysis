import React, { Fragment } from 'react'

import { ActionLink } from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import PETS from 'data/PETS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import { Rule, Requirement } from 'parser/core/modules/Checklist'

const AETHER_ACTIONS = [
	ACTIONS.ENERGY_DRAIN.id,
	ACTIONS.BANE.id,
	ACTIONS.FESTER.id,
	ACTIONS.PAINFLARE.id
]

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
	// I'm assuming they're starting with 3.
	// TODO: Check this in some manner maybeeeeee?
	aetherflow = 3
	aethertrailAttunement = 0
	dreadwyrmAether = 0

	// First DWT should be rushed. Also used for end-of-fight rush
	rushing = true

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
	on_cast_byPlayer(event) {
		const abilityId = event.ability.guid

		if (abilityId === ACTIONS.AETHERFLOW.id) {
			// Flow restores up to 3 flow stacks
			// flow + trail can never be >3
			// TODO: Check for lost flow
			this.aetherflow = 3 - this.aethertrailAttunement
			console.log('flow filled')

			// (Should be) rushing if it's the last flow of the fight, and there won't be enough time for a full rotation.
			// Need ~26s for a proper DWT, plus at least another 20 if SB would be up.
			let reqRotationTime = 26000
			if (this.dreadwyrmAether >= 1) {
				reqRotationTime += 20000
			}

			const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
			this.rushing = reqRotationTime >= fightTimeRemaining
		}

		if (AETHER_ACTIONS.includes(abilityId)) {
			// Aether actions convert flow into trail
			// TODO: Check for using flow when none
			this.aetherflow --
			this.aethertrailAttunement ++
			console.log('flow spent,', this.aetherflow, this.aethertrailAttunement)
		}

		if (abilityId === ACTIONS.DREADWYRM_TRANCE.id) {
			// DWT resets 3D
			this.cooldowns.resetCooldown(ACTIONS.TRI_DISASTER.id)

			// DWT spends 3 trail
			// TODO: Check for DWT when <3 trail
			this.aethertrailAttunement = 0
			console.log('dwt started')
		}

		if (abilityId === ACTIONS.SUMMON_BAHAMUT.id) {
			// Summon Bahamut spends both dwa
			this.dreadwyrmAether = 0
			console.log('bro summoned')
		}
	}

	on_removebuff_byPlayer(event) {
		const statusId = event.ability.guid

		if (statusId === STATUSES.DREADWYRM_TRANCE.id) {
			// The end of DWT (either DF or natural falloff) bestows 1 dwa, max 2.
			// TODO: check for lost dwa
			this.dreadwyrmAether = Math.min(this.dreadwyrmAether + 1, 2)
			console.log('dwt over,', this.dreadwyrmAether)
		}
	}

	on_death_toPlayer() {
		// Death just flat out resets everything. Rip.
		// TODO: Count stuff lost at death towards mistakes from other stuff
		this.aetherflow = 0
		this.aethertrailAttunement = 0
		this.dreadwyrmAether = 0
		console.log('he ded')
	}

	on_complete() {
		// Checklist rule for aetherflow cooldown
		this.checklist.add(new Rule({
			name: <Fragment>Use <ActionLink {...ACTIONS.AETHERFLOW} /> effectively</Fragment>,
			description: 'SMN\'s entire kit revolves around the Aetherflow cooldown. Make sure you squeeze every possible use out of it that you can.',
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.AETHERFLOW} /> cooldown uptime</Fragment>,
					percent: (this.cooldowns.getTimeOnCooldown(ACTIONS.AETHERFLOW.id) / this.parser.fightDuration) * 100
				})
			]
		}))
	}
}
