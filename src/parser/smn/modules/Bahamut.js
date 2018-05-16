import React, { Fragment } from 'react'

import ACTIONS from 'data/ACTIONS'
import PETS from 'data/PETS'
import Module from 'parser/core/Module'

export default class Bahamut extends Module {
	static dependencies = [
		'gauge'
	]
	name = 'Bahamut'

	counting = false
	wwCount = 0
	amCount = 0

	results = []

	// TODO: Handle final push bahamut - push to just toss it in for those akh morns and shit

	// TODO: Limit to pet only?
	on_cast(event) {
		const abilityId = event.ability.guid

		// Track casts - these only happen during the summon window so w/e
		// TODO: Probably should have _some_ handling for shit outside the window 'cus that's jank
		if (abilityId === ACTIONS.WYRMWAVE.id) {
			this.wwCount ++
		}

		if (abilityId === ACTIONS.AKH_MORN.id) {
			this.amCount ++
		}
	}

	on_summonpet(event) {
		// Set this up so we know that something's started
		if (!this.counting && event.petId === PETS.DEMI_BAHAMUT.id) {
			this.counting = true
			this.wwCount = 0
			this.amCount = 0
		}

		// Aaaand pull it apart again once we're done
		if (this.counting && event.petId !== PETS.DEMI_BAHAMUT.id) {
			this.counting = false
			this.results.push({ww: this.wwCount, am: this.amCount})
		}
	}

	output() {
		// This is fugly
		return <Fragment>
			<ul>
				{this.results.map((result, index) => <li key={index}>
					WW: {result.ww}<br/>
					AM: {result.am}
				</li>)}
			</ul>
		</Fragment>
	}
}
