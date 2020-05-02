import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import PETS from 'data/PETS'
import Module from 'parser/core/Module'
import {DEMIS} from './Gauge'

const DEMI_ACTIONS = Object.values(ACTIONS)
	.filter(action => action.pet && DEMIS.includes(action.pet))
	.map(action => action.id)

const PLAYER_DEMI_ACTIONS = [
	ACTIONS.ENKINDLE_BAHAMUT.id,
	ACTIONS.ENKINDLE_PHOENIX.id,
]

const DEMI_CHECKED_ACTIONS = {
	[PETS.DEMI_BAHAMUT.id]: {
		[ACTIONS.WYRMWAVE.id]: {
			name: 'WW',
			order: 0,
			expected: 8,
		},
		[ACTIONS.AKH_MORN.id]: {
			name: 'AM',
			order: 1,
			expected: 2,
		},
	},
	[PETS.DEMI_PHOENIX.id]: {
		[ACTIONS.SCARLET_FLAME.id]: {
			name: 'SF',
			order: 0,
			expected: 8,
		},
		[ACTIONS.REVELATION.id]: {
			name: 'R',
			order: 1,
			expected: 2,
		},
		[ACTIONS.FOUNTAIN_OF_FIRE.id]: {
			name: 'FoF',
			order: 2,
			expected: 4,
		},
		[ACTIONS.BRAND_OF_PURGATORY.id]: {
			name: 'BoP',
			order: 3,
			expected: 4,
		},
	},
}

export default class Demis extends Module {
	static handle = 'demis'
	static title = t('smn.demis.title')`Demi-summons`
	static dependencies = [
		'gauge',
		'pets',
	]

	_current = null
	_history = []

	constructor(...args) {
		super(...args)
		this.addEventHook('cast', {by: 'player'}, this._onPlayerCast)
		this.addEventHook('normaliseddamage', {
			by: 'pet',
			abilityId: DEMI_ACTIONS,
		}, this._onPetDamage)
		this.addEventHook('summonpet', this._onSummonPet)
		this.addEventHook('complete', this._onComplete)
	}

	_onPlayerCast(event) {
		// Ignore autos
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (!action || action.autoAttack) { return }

		// Track player actions during demi
		if (this.gauge.demiSummoned() &&
			(action.onGcd || PLAYER_DEMI_ACTIONS.includes(event.ability.guid))
		) {
			this._current.casts.push(event)
		}
	}

	_onPetDamage(event) {
		// If we've _somehow_ not got a _current, fake one
		if (!this._current) {
			this._current = {
				pet: this.pets.getCurrentPet(),
				timestamp: event.timestamp,
				rushing: this.gauge.isRushing(),
				casts: [],
			}
		}

		this._current.casts.push({
			...event,
			ghosted: event.successfulHitCount === 0,
		})
	}

	_onSummonPet(event) {
		if (!DEMIS.includes(event.petId)) { return }

		// Save any existing tracking to history
		if (this._current) {
			this._history.push(this._current)
		}

		// Set up fresh tracking
		this._current = {
			pet: getDataBy(PETS, 'id', event.petId),
			timestamp: event.timestamp,
			rushing: this.gauge.isRushing(),
			casts: [],
		}
	}

	_onComplete() {
		// Clean out any current tracking
		if (this._current) {
			this._history.push(this._current)
		}
	}

	output() {
		const panels = this._history.map(s => {
			const checked = DEMI_CHECKED_ACTIONS[s.pet.id]
			const counts = {}

			s.casts.forEach(cast => {
				const obj = counts[cast.ability.guid] = counts[cast.ability.guid] || {ghostCount: 0, hitCount: 0}
				if (cast.ghosted) {
					obj.ghostCount += 1
				} else {
					obj.hitCount += 1
				}
			})

			const lastPetAction = s.casts.reduce((carry, cast, i) => this.parser.byPlayerPet(cast)? i : carry, null)
			return {
				key: s.timestamp,
				title: {
					content: <>
						{this.parser.formatTimestamp(s.timestamp)}
						&nbsp;-&nbsp;
						{Object.keys(checked)
							.sort((a, b) => checked[a].order - checked[b].order)
							.map((id, index) => {
								const curCounts = counts[Number(id)]
								return <>
									{index > 0 && ', '}
									<span className={(curCounts && curCounts.hitCount >= checked[id].expected) ? 'text-success' : ''}>
										{this.renderHeaderCount(curCounts)}
									</span>
									{' ' + checked[id].name}
								</>
							})}
						{s.rushing && <span className="text-info">&nbsp;(rushing)</span>}
					</>,
				},
				content: {
					content: <ul>
						{s.casts.map((cast, i) => i <= lastPetAction && <li
							key={cast.timestamp + '-' + cast.ability.guid}
							className={this.getGhostClassName(cast.ghosted)}
						>
							<strong>{this.parser.formatDuration(cast.timestamp - s.timestamp, 2)}:</strong>&nbsp;
							{cast.ability.name}
						</li>)}
					</ul>,
				},
			}
		})

		return <>
			<Message>
				<Trans id="smn.demi.ghost-disclaimer">Demi-summon actions can &quot;ghost&quot; - the action resolves, and appears to do damage, however no damage is actually applied to the target. <strong className="text-error">Red</strong> highlighting has been applied to actions that ghosted.<br/>
				You should be aiming for:<br />
				8 Wyrmwave and 2 Akh Morn in each Summon Bahamut<br />
				8 Scarlet Flame, 2 Revelation, 4 Fountain Of Fire, and 4 Brand of Purgatory in each Firebird Trance.</Trans>
			</Message>
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		</>
	}

	renderHeaderCount(counts) {
		if (!counts) {
			return '0'
		}

		return <>
			<Fragment key="demiHit">
				<span className={this.getGhostClassName(false)}>{counts.hitCount}</span>
			</Fragment>
			{counts.ghostCount > 0 &&
			<Fragment key="demiGhost">
				/
				<span className={this.getGhostClassName(true)}>{counts.ghostCount}</span>
			</Fragment>}
		</>
	}

	getGhostClassName(ghosted) {
		return (ghosted) ? 'text-error' : ''
	}
}
