import React, { Fragment } from 'react'
import { Accordion, Message } from 'semantic-ui-react'

import ACTIONS from 'data/ACTIONS'
import PETS from 'data/PETS'
import Module from 'parser/core/Module'
import { SUMMON_BAHAMUT_LENGTH } from './Pets'

const DEMI_BAHAMUT_ACTIONS = Object.values(ACTIONS)
	.filter(action => action.pet && action.pet === PETS.DEMI_BAHAMUT.id)
	.map(action => action.id)
const GHOST_TIMEFRAME = 500

const GHOST_CHANCE = {
	NONE: 0,
	LIKELY: 1,
	ABSOLUTE: 2
}

const GHOST_CLASSNAME = {
	[GHOST_CHANCE.LIKELY]: 'text-warning',
	[GHOST_CHANCE.ABSOLUTE]: 'text-error'
}

export default class Bahamut extends Module {
	static dependencies = [
		'gauge'
	]
	name = 'Bahamut'

	current = null
	history = []

	on_cast_byPlayerPet(event) {
		const abilityId = event.ability.guid

		// Track Big B's casts, and mark potential ghosts
		if (DEMI_BAHAMUT_ACTIONS.includes(abilityId)) {
			const timeSinceSummon = event.timestamp - this.current.timestamp
			const ghostChance = timeSinceSummon >= SUMMON_BAHAMUT_LENGTH? GHOST_CHANCE.ABSOLUTE : timeSinceSummon < SUMMON_BAHAMUT_LENGTH - GHOST_TIMEFRAME? GHOST_CHANCE.NONE : GHOST_CHANCE.LIKELY
			this.current.petCasts.push({
				...event,
				ghostChance
			})
		}
	}

	on_summonpet(event) {
		// They've summoned Bahamut.
		if (event.petId === PETS.DEMI_BAHAMUT.id) {
			// Save any existing tracking to history
			if (this.current) {
				this.history.push(this.current)
			}

			// Set up fresh tracking
			this.current = {
				timestamp: event.timestamp,
				// playerCasts: [],
				petCasts: []
			}
		}
	}

	on_complete() {
		// Clean out any current tracking
		if (this.current) {
			this.history.push(this.current)
		}
	}

	output() {
		const expanded = []
		const panels = this.history.map((sb, index) => {
			const wws = sb.petCasts.filter(cast => cast.ability.guid === ACTIONS.WYRMWAVE.id)
			const ams = sb.petCasts.filter(cast => cast.ability.guid === ACTIONS.AKH_MORN.id)

			// If there's ghosts, expand by default
			if (sb.petCasts.some(cast => cast.ghostChance > GHOST_CHANCE.NONE)) {
				expanded.push(index)
			}

			return {
				title: {
					key: 'title-' + index,
					content: <Fragment>
						{this.parser.formatTimestamp(sb.timestamp)}
						&nbsp;-&nbsp;
						{wws.length} WWs, {ams.length} AMs
					</Fragment>
				},
				content: {
					key: 'content-' + index,
					content: <ul>
						{sb.petCasts.map(cast => <li
							key={cast.timestamp}
							className={GHOST_CLASSNAME[cast.ghostChance]}
						>
							<strong>{this.parser.formatDuration(cast.timestamp - sb.timestamp, 2)}:</strong>&nbsp;
							{cast.ability.name}
						</li>)}
					</ul>
				}
			}
		})

		return <Fragment>
			<Message>
				Bahamut actions can &quot;ghost&quot; - the action resolves, and appears to do damage, however no damage is actually applied to the target. <strong className="text-warning">Yellow</strong> highlighting has been applied to actions that likely ghosted, and <strong className="text-error">Red</strong>  to those that ghosted without a doubt.
			</Message>
			<Accordion
				exclusive={false}
				panels={panels}
				defaultActiveIndex={expanded}
				styled
				fluid
			/>
		</Fragment>
	}
}
