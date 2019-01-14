import React from 'react'

//import CoreCombos from 'parser/core/modules/Combos'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import STATUSES from 'data/STATUSES'
import ACTIONS, {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
//import {matchClosestLower} from 'utilities'
import {Button, Table} from 'semantic-ui-react'
import Rotation from 'components/ui/Rotation'
import {Plural, Trans} from '@lingui/react'
import {formatDuration} from 'utilities'
import {MANA_GAIN, MANA_CAP, MANA_DIFFERENCE_THRESHOLD} from './Gauge'

const FINISHERS = [
	ACTIONS.VERHOLY,
	ACTIONS.VERFLARE,
]
const SEVERITY_WASTED_FINISHER = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}
const IGNORE_FINISHER_PROCS_MANA_LOSS_THRESHOLD = 7

export default class MeleeCombos extends Module {
	static handle = 'meleecombos'
	// Disable unused dependency detection because module requires gauge for the fabricated event but no other data that triggers the used dependency check
	/* eslint-disable xivanalysis/no-unused-dependencies */
	static dependencies = [
		'combatants',
		'suggestions',
		'gauge',
	]
	/* eslint-enable xivanalysis/no-unused-dependencies */
	static title = 'Melee Combos'

	constructor(...args) {
		super(...args)

		this.addHook('rdmCast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_meleeCombos = {}

	//Finisher Handling
	_incorrectFinishers = {
		verholy: 0,
		verflare: 0,
		delay: 0,
	}

	_startCombo(event) {
		this._currentCombo = {
			start: event.timestamp,
			startmana: {
				white: event.mana.white.beforecast,
				black: event.mana.black.beforecast,
			},
			startprocs: {
				verstone: this.combatants.selected.hasStatus(STATUSES.VERSTONE_READY.id),
				verfire: this.combatants.selected.hasStatus(STATUSES.VERFIRE_READY.id),
				acceleration: this.combatants.selected.hasStatus(STATUSES.ACCELERATION.id),
			},
			events: [event],
		}
	}

	_breakComboIfExists() {
		if (this._currentCombo) {
			this._currentCombo.broken = true
			this._endCombo()
		}
	}

	_endCombo() {
		this._meleeCombos[this._currentCombo.start] = this._currentCombo
		delete this._currentCombo
	}

	_handleFinisher() {
		const isFireReady = this.combatants.selected.hasStatus(STATUSES.VERFIRE_READY.id)
		const isStoneReady = this.combatants.selected.hasStatus(STATUSES.VERSTONE_READY.id)
		const combo = this._currentCombo
		const finisherUsed = combo.events[combo.events.length-1].ability.guid

		if (combo.startmana.white < combo.startmana.black) {
			combo.recommendedFinisher = this._outOfBalanceFinisher(combo.startmana.white, isStoneReady, ACTIONS.VERHOLY, combo.startmana.black, isFireReady, ACTIONS.VERFLARE)
		} else if (combo.startmana.black < combo.startmana.white) {
			combo.recommendedFinisher = this._outOfBalanceFinisher(combo.startmana.black, isFireReady, ACTIONS.VERFLARE, combo.startmana.white, isStoneReady, ACTIONS.VERHOLY)
		} else {
			combo.recommendedFinisher = this._inBalanceFinisher(combo.startmana.white, isStoneReady, ACTIONS.VERHOLY, combo.startmana.black, isFireReady, ACTIONS.VERFLARE)
		}

		if (combo.recommendedFinisher === null) {
			// a recommendation of NULL is to delay the combo
			this._incorrectFinishers.delay++
		} else if (combo.recommendedFinisher === FINISHERS) {
			// a recommendation of both finishers means ignore the finisher, either one is valid
		} else if (finisherUsed !== combo.recommendedFinisher.id) {
			// wrong finisher was used, add an incorrect finisher tally
			if (combo.recommendedFinisher === ACTIONS.VERHOLY) {
				this._incorrectFinishers.verholy++
			}
			if (combo.recommendedFinisher === ACTIONS.VERFLARE) {
				this._incorrectFinishers.verflare++
			}
		}
	}

	_outOfBalanceFinisher(lowerMana, lowerManaProc, lowerManaFinisher, higherMana, higherManaProc, higherManaFinisher) {
		const isAccelerationUp = this.combatants.selected.hasStatus(STATUSES.ACCELERATION.id)

		if (!lowerManaProc) {
			// no proc of the lower mana spell, use that finisher
			return lowerManaFinisher
		}

		if (!higherManaProc) {
			// no proc of the higher mana spell, check accleration and potential out of balance to make recommendation
			if (higherMana - lowerMana + Math.max(MANA_GAIN[higherManaFinisher.id].white, MANA_GAIN[higherManaFinisher.id].black) > MANA_DIFFERENCE_THRESHOLD) {
				// We will go out of balance if we use the finisher of the higher mana, check to see if delaying combo would have been better
				if (this._manaLossToDelayCombo(lowerMana, lowerManaProc, higherMana, higherManaProc) <= IGNORE_FINISHER_PROCS_MANA_LOSS_THRESHOLD) {
					// return null (delay combo) if below threshold
					return null
				}
				// Going out of balance is worse than overwriting the lowerManaProc - recommend using the lowerMana finisher to stay in balance
				return lowerManaFinisher
			}

			// We won't go out of balance if we use the finisher of the higher mana, check to see if acceleration is up
			if (isAccelerationUp) {
				// Acceleration is up, use higherManaFinisher
				return higherManaFinisher
			}
			// Acceleration not on, check to see if delaying combo would have been better
			if (this._manaLossToDelayCombo(lowerMana, lowerManaProc, higherMana, higherManaProc) <= IGNORE_FINISHER_PROCS_MANA_LOSS_THRESHOLD) {
				// return null (delay combo) if below threshold
				return null
			}
			// If delaying finisher isn't worthwhile, but we won't go out of balance by using the higherManaFinisher, fishing for a 20% proc is better than overwriting the existing proc
			return higherManaFinisher
		}

		// Both procs are up, check to see if delaying combo would have been better
		if (this._manaLossToDelayCombo(lowerMana, lowerManaProc, higherMana, higherManaProc) <= IGNORE_FINISHER_PROCS_MANA_LOSS_THRESHOLD) {
			// return null (delay combo) if below threshold
			return null
		}
		// return both finishers (finisher doesn't matter) if above the threshold where the mana loss from delaying outweighs benefit of forced proc
		return FINISHERS
	}

	_inBalanceFinisher(firstMana, firstManaProc, firstManaFinisher, secondMana, secondManaProc, secondManaFinisher) {
		const isAccelerationUp = this.combatants.selected.hasStatus(STATUSES.ACCELERATION.id)

		if (isAccelerationUp) {
			// Acceleration is up - return finisher that will guarantee a proc
			if (!firstManaProc && !secondManaProc) {
				// Neither proc is up - return both finishers (finisher doesn't matter)
				return FINISHERS
			}
			if (!firstManaProc) {
				return firstManaFinisher
			}
			if (!secondManaProc) {
				return secondManaFinisher
			}
		}

		// Acceleration is not up or both procs are up, check to see if delaying combo would have been better
		if (this._manaLossToDelayCombo(firstMana, firstManaProc, secondMana, secondManaProc) <= IGNORE_FINISHER_PROCS_MANA_LOSS_THRESHOLD) {
			// return null (delay combo) if below threshold
			return null
		}
		// Delaying combo is not better, return finisher of proc that isn't available (fishing for 20% is better than overwriting a proc or delaying
		if (!firstManaProc) {
			return firstManaFinisher
		}
		if (!secondManaProc) {
			return secondManaFinisher
		}
		// Both procs are up and it's not worthwhile to delay combo, return both finishers (finisher doesn't matter)
		return FINISHERS
	}

	_manaLossToDelayCombo(lowerMana, lowerManaProc, higherMana, higherManaProc) {
		let delayedLowerMana = 0
		let delayedHigherMana = 0

		if (lowerManaProc) {
			// Check to see if clearing the lowerManaProc results in lowerMana remaining lower
			// since VerStone/VerFire and VerAero/VerThunder are the same, just white vs black mana, pick one set to use for calculations
			delayedLowerMana = lowerMana + MANA_GAIN[ACTIONS.VERSTONE.id].white
			delayedHigherMana = higherMana + MANA_GAIN[ACTIONS.VERTHUNDER.id].black

			if (delayedLowerMana >= MANA_CAP || delayedLowerMana < delayedHigherMana) {
				// If clearing lowerManaProc results in overcapping both mana types, return this overage and don't calculate further
				// If clearing lowerManaProc results in lowerMana < higherMana (the cleared proc is the lower mana after the delay), return mana loss for this case
				return (Math.max(delayedLowerMana - MANA_CAP, 0) + Math.max(delayedHigherMana - MANA_CAP, 0))
			}

			// Clearing the lowerManaProc results in equal mana or higherMana becoming the lower value, check loss to double-cast lowerMana instead
			delayedLowerMana = lowerMana + MANA_GAIN[ACTIONS.VERSTONE.id].white + MANA_GAIN[ACTIONS.VERAERO.id].white
			delayedHigherMana = higherMana

			return (Math.max(delayedLowerMana - MANA_CAP, 0) + Math.max(delayedHigherMana - MANA_CAP, 0))
		}

		// No lowerManaProc, check higherManaProc instead -- case can be hit if we were starting even (higherMana == lowerMana)
		if (higherManaProc) {
			// Check to see if clearing the higherManaProc results in higherMana becoming lower
			// since VerStone/VerFire and VerAero/VerThunder are the same, just white vs black mana, pick one set to use for calculations
			delayedLowerMana = lowerMana + MANA_GAIN[ACTIONS.VERAERO.id].white
			delayedHigherMana = higherMana + MANA_GAIN[ACTIONS.VERFIRE.id].black

			if (delayedHigherMana >= MANA_CAP || delayedHigherMana < delayedLowerMana) {
				// If clearing lowerManaProc results in overcapping both mana types, return this overage and don't calculate further
				// If clearing lowerManaProc results in lowerMana < higherMana (the cleared proc is the lower mana after the delay), return mana loss for this case
				return (Math.max(delayedLowerMana - MANA_CAP, 0) + Math.max(delayedHigherMana - MANA_CAP, 0))
			}

			// Clearing the higherManaProc results in equal mana or lowerMana becoming the lower value, check loss to double-cast higherMana instead
			delayedLowerMana = lowerMana
			delayedHigherMana = higherMana + MANA_GAIN[ACTIONS.VERFIRE.id].black + MANA_GAIN[ACTIONS.VERTHUNDER.id].black

			return (Math.max(delayedLowerMana - MANA_CAP, 0) + Math.max(delayedHigherMana - MANA_CAP, 0))
		}

		// Neither proc is up, check with using Jolt or Impact + higherMana's dualcast spell to delay so that lowerMana will get guaranteed proc
		if (this.combatants.selected.hasStatus(STATUSES.IMPACTFUL.id)) {
			delayedLowerMana = lowerMana + MANA_GAIN[ACTIONS.IMPACT.id].white
			delayedHigherMana = higherMana + MANA_GAIN[ACTIONS.IMPACT.id].black + MANA_GAIN[ACTIONS.VERTHUNDER.id].black
		} else {
			delayedLowerMana = lowerMana + MANA_GAIN[ACTIONS.JOLT_II.id].white
			delayedHigherMana = higherMana + MANA_GAIN[ACTIONS.JOLT_II.id].black + MANA_GAIN[ACTIONS.VERTHUNDER.id].black
		}
		return (Math.max(delayedLowerMana - MANA_CAP, 0) + Math.max(delayedHigherMana - MANA_CAP, 0))
	}

	_onCast(event) {
		const action = getAction(event.ability.guid)
		if (action.combo) {
			if (action.combo.start) {
				this._breakComboIfExists()
				this._startCombo(event)
			} else {
				if (!this._currentCombo) {
					console.log(`Uncomboed ability: ${event.ability.name}, timestamp: ${this.parser.formatTimestamp(event.timestamp)}`)
				}

				const lastAction = this._currentCombo.events[this._currentCombo.events.length-1]
				if (action.combo.from !== lastAction.ability.guid) {
					this._currentCombo.broken = true
					this._endCombo()
				} else {
					this._currentCombo.events.push(event)
					if (action.combo.end) {
						this._currentCombo.finisher = action.id
						this._handleFinisher()
						this._endCombo()
					}
				}
			}
		}

		if (action.id === ACTIONS.ACCELERATION.id) {
			// Add Acceleration events to the melee combo rotation to show usage and for determining recommended finisher
			this._currentCombo.events.push(event)
		}

		if (action.breaksCombo) {
			this._breakComboIfExists()
		}
	}

	_onDeath() {
		// Break any current combo on death
		this._breakComboIfExists()
	}

	_onComplete() {
		// Finish any open combos
		this._breakComboIfExists()

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.VERHOLY.icon,
			content: <Trans id="rdm.gauge.suggestions.wastedverholy.content">
				You should use <ActionLink {...ACTIONS.VERHOLY} /> over <ActionLink {...ACTIONS.VERFLARE} /> in the following situations in order of importance
				<ol>
					<li>When your white mana is lower</li>
					<li>Your mana is even and you have <StatusLink {...STATUSES.VERFIRE_READY} /> (Use <ActionLink {...ACTIONS.ACCELERATION} /> if available!)</li>
					<li>White mana is higher by 9 or less and <ActionLink {...ACTIONS.ACCELERATION} /> is available with <StatusLink {...STATUSES.VERFIRE_READY} /></li>
				</ol>
			</Trans>,
			why: <Plural id="rdm.gauge.suggestions.wastedverholy.why" value={this._incorrectFinishers.verflare} one="# Verstone cast was lost due to using Verflare incorrectly" other="# Verstone casts were lost due to using Verflare incorrectly" />,
			tiers: SEVERITY_WASTED_FINISHER,
			value: this._incorrectFinishers.verflare,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.VERFLARE.icon,
			content: <Trans id="rdm.gauge.suggestions.wastedverflare.content">
				You should use <ActionLink {...ACTIONS.VERFLARE} /> over <ActionLink {...ACTIONS.VERHOLY}/> in the following situations in order of importance
				<ol>
					<li>When your black mana is lower</li>
					<li>Your mana is even and you have <StatusLink {...STATUSES.VERSTONE_READY} /> (Use <ActionLink {...ACTIONS.ACCELERATION} /> if available!)</li>
					<li>Black mana is higher by 9 or less and <ActionLink {...ACTIONS.ACCELERATION} /> is available with <StatusLink {...STATUSES.VERSTONE_READY} /></li>
				</ol>
			</Trans>,
			why: <Plural id="rdm.gauge.suggestions.wastedverflare.why" value={this._incorrectFinishers.verholy} one="# Verfire cast was lost due to using Verholy incorrectly" other="# Verfire casts were lost due to using Verholy incorrectly" />,
			tiers: SEVERITY_WASTED_FINISHER,
			value: this._incorrectFinishers.verholy,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.VERSTONE.icon,
			content: <Trans id="rdm.gauge.suggestions.wastedprocs.content">
				Do not enter your combo with both procs up when <ActionLink {...ACTIONS.ACCELERATION}/> is down, consider dumping one of the procs before entering the melee combo as long as you gain at least 4 mana
			</Trans>,
			why: <Plural id="rdm.gauge.suggestions.wastedprocs.why" value={this._incorrectFinishers.bothprocsup} one="# Proc cast was lost due to entering the melee combo with both procs up." other="# Procs casts were lost due to entering the melee combo with both procs up." />,
			tiers: SEVERITY_WASTED_FINISHER,
			value: this._incorrectFinishers.bothprocsup,
		}))
	}

	output() {
		return (
			<Table compact unstackable celled>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell collapsing>
							<strong><Trans id="rdm.meleecombos.table.header.time">Time</Trans></strong>
						</Table.HeaderCell>
						<Table.HeaderCell collapsing>
							<strong><Trans id="rdm.meleecombos.table.header.starting-mana">Starting Mana</Trans></strong>
						</Table.HeaderCell>
						<Table.HeaderCell collapsing>
							<strong><Trans id="rdm.meleecombos.table.header.starting-procs">Starting Procs</Trans></strong>
						</Table.HeaderCell>
						<Table.HeaderCell>
							<strong><Trans id="rdm.meleecombos.table.header.rotation">Rotation</Trans></strong>
						</Table.HeaderCell>
						<Table.HeaderCell>
							<strong><Trans id="rdm.meleecombos.table.header.recommended">Recommended</Trans></strong>
						</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{
						Object.keys(this._meleeCombos).map(timestamp => {
							const combo = this._meleeCombos[timestamp]
							const white = combo.startmana.white
							const black = combo.startmana.black
							const rotation = combo.events
							const start = (timestamp - this.parser.fight.start_time) / 1000

							return (<Table.Row key={timestamp}>
								<Table.Cell textAlign="center">
									<span style={{marginRight: 5}}>{formatDuration(start)}</span>
									{<Button
										circular
										compact
										size="mini"
										icon="time"
									/>}
								</Table.Cell>
								<Table.Cell>
									<span style={{whiteSpace: 'pre'}}>{white} White | {black} Black</span>
								</Table.Cell>
								<Table.Cell textAlign="center">
									<span>{
										Object.keys(combo.startprocs).map((key) => {
											if (combo.startprocs[key]) {
												switch (key) {
												case 'verstone':
													return (<StatusLink key="verstone" showName={false} {...STATUSES.VERSTONE_READY}/>)
												case 'verfire':
													return (<StatusLink key="verfire" showName={false} {...STATUSES.VERFIRE_READY}/>)
												case 'acceleration':
													return (<StatusLink key="acceleration" showName={false} {...STATUSES.ACCELERATION}/>)
												}
											}
										})
									}</span>
								</Table.Cell>
								<Table.Cell>
									<Rotation events={rotation} style={{whiteSpace: 'pre'}}/>
								</Table.Cell>
								<Table.Cell>
									<ActionLink showName={false} {...combo.recommendedFinisher}/>
								</Table.Cell>
							</Table.Row>)
						})
					}
				</Table.Body>
			</Table>
		)
	}
}
