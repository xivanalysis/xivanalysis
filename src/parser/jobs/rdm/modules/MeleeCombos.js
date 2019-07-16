import React from 'react'

//import CoreCombos from 'parser/core/modules/Combos'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
//import {matchClosestLower} from 'utilities'
import {Button, Table} from 'semantic-ui-react'
import Rotation from 'components/ui/Rotation'
import {Plural, Trans} from '@lingui/react'
import {formatDuration} from 'utilities'
import {MANA_GAIN, MANA_CAP, MANA_DIFFERENCE_THRESHOLD} from './Gauge'

//const util = require('util')

const FINISHERS = [
	ACTIONS.VERHOLY,
	ACTIONS.VERFLARE,
]
const SEVERITY_WASTED_FINISHER = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}
const IGNORE_FINISHER_PROCS_MANA_LOSS_THRESHOLD = 4

const WHITE_MANA_ACTIONS = {
	proc: ACTIONS.VERSTONE,
	dualcast: ACTIONS.VERAERO,
	finisher: ACTIONS.VERHOLY,
}
const BLACK_MANA_ACTIONS = {
	proc: ACTIONS.VERFIRE,
	dualcast: ACTIONS.VERTHUNDER,
	finisher: ACTIONS.VERFLARE,
}

// 4 seconds for 2 GCDs minus a 1 second window to activate before finisher
const DELAY_ACCELERATION_AVAILABLE_THRESHOLD = 4

export default class MeleeCombos extends Module {
	static handle = 'meleecombos'
	static dependencies = [
		'combatants',
		'suggestions',
		'cooldowns',
		'timeline',
	]
	static title = 'Melee Combos'

	constructor(...args) {
		super(...args)

		this.addHook('cast', {
			by: 'player',
			abilityId: ACTIONS.ACCELERATION.id,
		}, this._onCast)
		this.addHook('rdmcast', {by: 'player'}, this._onCast)
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
			startMana: {
				white: event.mana.white.beforeCast,
				black: event.mana.black.beforeCast,
			},
			startProcs: {
				verstone: this.combatants.selected.hasStatus(STATUSES.VERSTONE_READY.id),
				verfire: this.combatants.selected.hasStatus(STATUSES.VERFIRE_READY.id),
				acceleration: this.combatants.selected.hasStatus(STATUSES.ACCELERATION.id),
			},
			events: [event],
			lastAction: event,
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
		const combo = this._currentCombo
		combo.finisher.recommendedActions = []
		combo.finisher.recommendation = ''

		const whiteState = {
			amount: combo.startMana.white,
			procReady: combo.startProcs.verstone,
			actions: WHITE_MANA_ACTIONS,
		}
		const blackState = {
			amount: combo.startMana.black,
			procReady: combo.startProcs.verfire,
			actions: BLACK_MANA_ACTIONS,
		}

		let recommendedFinisher = null
		if (combo.startMana.white < combo.startMana.black) {
			recommendedFinisher = this._outOfBalanceFinisher(whiteState, blackState)
		} else if (combo.startMana.black < combo.startMana.white) {
			recommendedFinisher = this._outOfBalanceFinisher(blackState, whiteState)
		} else {
			recommendedFinisher = this._inBalanceFinisher(blackState, whiteState)
		}

		if (recommendedFinisher instanceof Array) {
			if (recommendedFinisher === FINISHERS) {
				// a recommendation of both finishers means ignore the finisher, either one is valid
				combo.finisher.recommendedActions.push(getDataBy(ACTIONS, 'id', combo.finisher.used.guid) || {})
			} else {
				// a recommendation of an array of actions is to delay the combo
				Array.prototype.push.apply(combo.finisher.recommendedActions, recommendedFinisher)
				this._incorrectFinishers.delay++
				combo.finisher.recommendation = <Trans id="rdm.meleecombos.recommendation.delay">Delay your melee combo to guarantee a proc from your finisher, if you will lose {IGNORE_FINISHER_PROCS_MANA_LOSS_THRESHOLD} or less mana to overcapping.</Trans>
			}
		} else {
			// A specific finisher was recommended
			combo.finisher.recommendedActions.push(recommendedFinisher)
			if (combo.finisher.used.guid !== recommendedFinisher.id) {
				// wrong finisher was used, add an incorrect finisher tally
				if (combo.finisher.used.guid === ACTIONS.VERHOLY.id) {
					this._incorrectFinishers.verholy++
				}
				if (combo.finisher.used.guid === ACTIONS.VERFLARE.id) {
					this._incorrectFinishers.verflare++
				}
				combo.finisher.recommendation = <Trans id="rdm.meleecombos.recommendation.incorrect">See the suggestions section for finisher guidelines.</Trans>
			}
		}
	}

	_outOfBalanceFinisher(lowerManaState, higherManaState) {
		const isAccelerationUp = this.combatants.selected.hasStatus(STATUSES.ACCELERATION.id)

		if (!lowerManaState.procReady) {
			// no proc of the lower mana spell, use that finisher
			return lowerManaState.actions.finisher
		}

		const comboDelayResults = this._manaLossToDelayCombo(lowerManaState, higherManaState)
		if (!higherManaState.procReady) {
			// no proc of the higher mana spell, check accleration and potential out of balance to make recommendation
			const finisherManaGain = MANA_GAIN[higherManaState.actions.finisher.id].white || MANA_GAIN[higherManaState.actions.finisher.id].black
			if (higherManaState.amount - lowerManaState.amount + finisherManaGain > MANA_DIFFERENCE_THRESHOLD) {
				// We will go out of balance if we use the finisher of the higher mana, check to see if delaying combo would have been better
				if (comboDelayResults !== null && comboDelayResults.manaLoss <= IGNORE_FINISHER_PROCS_MANA_LOSS_THRESHOLD) {
					// return null (delay combo) if below threshold
					return comboDelayResults.finisher
				}
				// Going out of balance is worse than overwriting the lowerManaProc - recommend using the lowerMana finisher to stay in balance
				return lowerManaState.actions.finisher
			}

			// We won't go out of balance if we use the finisher of the higher mana, check to see if acceleration is up
			if (isAccelerationUp) {
				// Acceleration is up, use higherManaFinisher
				return higherManaState.actions.finisher
			}
			// Acceleration not on, check to see if delaying combo would have been better
			if (comboDelayResults !== null && comboDelayResults.manaLoss <= IGNORE_FINISHER_PROCS_MANA_LOSS_THRESHOLD) {
				// return null (delay combo) if below threshold
				return comboDelayResults.finisher
			}
			// If delaying finisher isn't worthwhile, but we won't go out of balance by using the higherManaFinisher, fishing for a 20% proc is better than overwriting the existing proc
			return higherManaState.actions.finisher
		}

		// Both procs are up, check to see if delaying combo would have been better
		if (comboDelayResults !== null && comboDelayResults.manaLoss <= IGNORE_FINISHER_PROCS_MANA_LOSS_THRESHOLD) {
			// return null (delay combo) if below threshold
			return comboDelayResults.finisher
		}
		// return both finishers (finisher doesn't matter) if above the threshold where the mana loss from delaying outweighs benefit of forced proc
		return FINISHERS
	}

	_inBalanceFinisher(firstManaState, secondManaState) {
		const isAccelerationUp = this.combatants.selected.hasStatus(STATUSES.ACCELERATION.id)

		if (!isAccelerationUp || (firstManaState.procReady && secondManaState.procReady)) {
			// Acceleration is not up or both procs are up, check to see if delaying combo would have been better
			const comboDelayResults = this._manaLossToDelayCombo(firstManaState, secondManaState)
			// Safeguard against null return if no valid delays were found
			if (comboDelayResults !== null && comboDelayResults.manaLoss <= IGNORE_FINISHER_PROCS_MANA_LOSS_THRESHOLD) {
				// return null (delay combo) if below threshold
				return comboDelayResults.finisher
			}
		}

		// Acceleration is up or delaying combo is not better, return finisher of proc that isn't available (fishing for 20% is better than overwriting a proc or delaying)
		if (!firstManaState.procReady && !secondManaState.procReady) {
			// Neither proc is up - return both finishers (finisher doesn't matter)
			return FINISHERS
		}
		if (!firstManaState.procReady) {
			return firstManaState.actions.finisher
		}
		if (!secondManaState.procReady) {
			return secondManaState.actions.finisher
		}
		// Both procs are up and it's not worthwhile to delay combo, return both finishers (finisher doesn't matter)
		return FINISHERS
	}

	_manaLossToDelayCombo(lowerManaState, higherManaState) {
		const possibleDelays = []

		if (lowerManaState.procReady) {
			/* Case: lowerManaProc is available, "clear" the proc by casting Lower Proc + Higher Dualcast
				This case is valid whether or not the higherManaProc exists
				Overwriting the higherManaProc with the 50% chance while dumping is no net loss of procs compared to not delaying */
			// Net benefit: +1 proc gained (lowerMana) for effective potency of +34.8 (8 Mana)
			let newLowerMana = lowerManaState.amount + (MANA_GAIN[lowerManaState.actions.proc.id].white || MANA_GAIN[lowerManaState.actions.proc.id].black)
			let newHigherMana = higherManaState.amount + (MANA_GAIN[higherManaState.actions.dualcast.id].white || MANA_GAIN[higherManaState.actions.dualcast.id].black)

			// Determine how much mana would be wasted to cap with this delay, then adjust post-delay mana totals to cap before further comparisons
			const manaLoss = Math.max(newLowerMana - MANA_CAP, 0) + Math.max(newHigherMana - MANA_CAP, 0)
			newLowerMana = Math.min(newLowerMana, MANA_CAP)
			newHigherMana = Math.min(newHigherMana, MANA_CAP)

			if (newLowerMana < newHigherMana) {
				// The proc we just cleared is still the lower mana, valid clear option, push onto stack
				possibleDelays.push({
					finisher: [lowerManaState.actions.proc, higherManaState.actions.dualcast, lowerManaState.actions.finisher],
					manaLoss: manaLoss,
				})
			} else {
				// Verify that using the finisher of the proc we just cleared won't put us out of balance at the end
				const finisherManaGain = MANA_GAIN[lowerManaState.actions.finisher.id].white || MANA_GAIN[lowerManaState.actions.finisher.id].black
				if (!(newLowerMana + finisherManaGain - newHigherMana) > MANA_DIFFERENCE_THRESHOLD) {
					// The proc we just cleared will result in equal mana or the cleared proc being higher but without putting us out of balance, check to see if acceleration would be available
					const accelerationAvailable = (this.combatants.selected.hasStatus(STATUSES.ACCELERATION.id) || this.cooldowns.getCooldownRemaining(ACTIONS.ACCELERATION.id) <= DELAY_ACCELERATION_AVAILABLE_THRESHOLD)
					if (accelerationAvailable) {
						possibleDelays.push({
							finisher: [lowerManaState.actions.proc, higherManaState.actions.dualcast, ACTIONS.ACCELERATION, lowerManaState.actions.finisher],
							manaLoss: manaLoss,
						})
					}
				}
			}

			if (!higherManaState.procReady) {
				/* Case: lowerManaProc is available and higherManaProc is not, attempt to "rebalance" mana by casting lowerManaProc + lowerManaDualcast
					This is an additional and separate case to just clearing and "wasting" the higherManaProc in the case of both procs being up
					and can result in less mana loss than the lowerProc -> higherDualcast dump of the above case (e.g. when starting at 80|100) */
				// Net benefit: +1 proc gained (higherMana) for effective potency of +34.8 (8 Mana)
				let newLowerMana = lowerManaState.amount + (MANA_GAIN[lowerManaState.actions.proc.id].white || MANA_GAIN[lowerManaState.actions.proc.id].black) + (MANA_GAIN[lowerManaState.actions.dualcast.id].white || MANA_GAIN[lowerManaState.actions.dualcast.id].black)
				let newHigherMana = higherManaState.amount

				// Determine how much mana would be wasted to cap with this delay, then adjust post-delay mana totals to cap before further comparisons
				const manaLoss = Math.max(newLowerMana - MANA_CAP, 0) + Math.max(newHigherMana - MANA_CAP, 0)
				newLowerMana = Math.min(newLowerMana, MANA_CAP)
				newHigherMana = Math.min(newHigherMana, MANA_CAP)

				if (newHigherMana < newLowerMana) {
					// Mana rebalancing resulted in the original higherMana becoming the lower total (guaranteed proc), valid option, push onto stack
					possibleDelays.push({
						finisher: [lowerManaState.actions.proc, lowerManaState.actions.dualcast, higherManaState.actions.finisher],
						manaLoss: manaLoss,
					})
				} else {
					// Verify that using the finisher of higherMana won't put us out of balance at the end
					const finisherManaGain = MANA_GAIN[higherManaState.actions.finisher.id].white || MANA_GAIN[higherManaState.actions.finisher.id].black
					if (!((newHigherMana + finisherManaGain - newLowerMana) > MANA_DIFFERENCE_THRESHOLD)) {
						// This is a net gain whether or not acceleration would be available - we can now fish for an additional proc of higherMana, push onto stack
						possibleDelays.push({
							finisher: [lowerManaState.actions.proc, lowerManaState.actions.dualcast, ACTIONS.ACCELERATION, higherManaState.actions.finisher],
							manaLoss: manaLoss,
						})
					}
				}
			}
		} else {
			// These cases should only be hit if lowerMana == higherMana (we were in balance at start of combo), to test benefits of delaying combo to imbalance mana
			// If lowerManaProc isn't available and lowerMana < higherMana, recommendation will always be the lowerManaActions.finisher
			if (higherManaState.procReady) { // eslint-disable-line no-lonely-if
				let newLowerMana = lowerManaState.amount + (MANA_GAIN[lowerManaState.actions.dualcast.id].white || MANA_GAIN[lowerManaState.actions.dualcast.id].black)
				let newHigherMana = higherManaState.amount + (MANA_GAIN[higherManaState.actions.proc.id].white || MANA_GAIN[higherManaState.actions.proc.id].black)

				// Determine how much mana would be wasted to cap with this delay, then adjust post-delay mana totals to cap before further comparisons
				const manaLoss = Math.max(newLowerMana - MANA_CAP, 0) + Math.max(newHigherMana - MANA_CAP, 0)
				newLowerMana = Math.min(newLowerMana, MANA_CAP)
				newHigherMana = Math.min(newHigherMana, MANA_CAP)

				if (newHigherMana < newLowerMana) {
					// Mana rebalancing resulted in the original higherMana becoming the lower total (guaranteed proc), valid option, push onto stack
					possibleDelays.push({
						finisher: [higherManaState.actions.proc, lowerManaState.actions.dualcast, higherManaState.actions.finisher],
						manaLoss: manaLoss,
					})
				}
			} else {
				// Neither proc is up, check with using Jolt  + higherMana's dualcast spell to delay so that lowerMana will get guaranteed proc
				let newLowerMana = lowerManaState.amount + MANA_GAIN[ACTIONS.JOLT_II.id].white
				let newHigherMana = higherManaState.amount + MANA_GAIN[ACTIONS.JOLT_II.id].black + (MANA_GAIN[higherManaState.actions.dualcast.id].white || MANA_GAIN[higherManaState.actions.dualcast.id].black)
				const firstDelaySkill = ACTIONS.JOLT_II

				// Determine how much mana would be wasted to cap with this delay, then adjust post-delay mana totals to cap before further comparisons
				const manaLoss = Math.max(newLowerMana - MANA_CAP, 0) + Math.max(newHigherMana - MANA_CAP, 0)
				newLowerMana = Math.min(newLowerMana, MANA_CAP)
				newHigherMana = Math.min(newHigherMana, MANA_CAP)
				if (newLowerMana < newHigherMana) {
					// Mana rebalancing resulted in the original higherMana becoming the lower total (guaranteed proc), valid option, push onto stack
					possibleDelays.push({
						finisher: [firstDelaySkill, lowerManaState.actions.dualcast, higherManaState.actions.finisher],
						manaLoss: manaLoss,
					})
				} else {
					// Check if using Jolt  + lowerMana's dualcast spell to delay so that higherMana will get guaranteed proc
					let newLowerMana = lowerManaState.amount + MANA_GAIN[ACTIONS.JOLT_II.id].white + (MANA_GAIN[lowerManaState.actions.dualcast.id].white || MANA_GAIN[lowerManaState.actions.dualcast.id].black)
					let newHigherMana = higherManaState.amount + MANA_GAIN[ACTIONS.JOLT_II.id].black
					const firstDelaySkill = ACTIONS.JOLT_II

					// Determine how much mana would be wasted to cap with this delay, then adjust post-delay mana totals to cap before further comparisons
					const manaLoss = Math.max(newLowerMana - MANA_CAP, 0) + Math.max(newHigherMana - MANA_CAP, 0)
					newLowerMana = Math.min(newLowerMana, MANA_CAP)
					newHigherMana = Math.min(newHigherMana, MANA_CAP)
					if (newHigherMana < newLowerMana) {
						// Mana rebalancing resulted in the original higherMana becoming the lower total (guaranteed proc), valid option, push onto stack
						possibleDelays.push({
							finisher: [firstDelaySkill, lowerManaState.actions.dualcast, higherManaState.actions.finisher],
							manaLoss: manaLoss,
						})
					}
				}
				// End cases for delaying combo to clear procs
			}
		}

		if (possibleDelays.length > 0) {
			// At least one valid case for delaying combo was found, return the most efficient (lowest manaLoss) for consideration
			possibleDelays.sort((a, b) => {
				if (a.manaLoss > b.manaLoss) {
					return 1
				}

				if (a.manaLoss < b.manaLoss) {
					return -1
				}

				return 0
			})

			return possibleDelays[0]
		}

		// No valid case for delaying combo was found
		return null
	}

	_onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (!action) { return }

		if (action.combo) {
			if (action.combo.start) {
				this._breakComboIfExists()
				this._startCombo(event)
			} else {
				if (!this._currentCombo) {
					return
				}

				//console.log(util.inspect(action, {showHidden: true, depth: null}))

				if (action.combo.from) {
					const fromOptions = Array.isArray(action.combo.from) ? action.combo.from : [action.combo.from]
					if (!fromOptions.includes(this._currentCombo.lastAction.ability.guid)) {
						this._currentCombo.broken = true
						this._endCombo()
					} else {
						this._currentCombo.events.push(event)
						this._currentCombo.lastAction = event
						if (action.combo.end) {
							this._currentCombo.finisher = {
								used: event.ability,
							}
							this._handleFinisher()
							this._endCombo()
						}
					}
				}
			}
		}

		if (action.id === ACTIONS.ACCELERATION.id) {
			// Add Acceleration events to the current melee combo (if any) to show usage and for determining recommended finisher
			if (this._currentCombo) { this._currentCombo.events.push(event) }
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
				Do not enter your combo with your finisher's proc up when <ActionLink {...ACTIONS.ACCELERATION}/> is down, consider dumping a proc before entering the melee combo as long as you waste less than 8 mana to overcapping
			</Trans>,
			why: <Plural id="rdm.gauge.suggestions.wastedprocs.why" value={this._incorrectFinishers.delay} one="# Proc cast was lost due to entering the melee combo with the finisher proc up." other="# Procs casts were lost due to entering the melee combo with the finisher proc up." />,
			tiers: SEVERITY_WASTED_FINISHER,
			value: this._incorrectFinishers.delay,
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
						<Table.HeaderCell collapsing>
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
							//console.log(util.inspect(timestamp, {showHidden: true, depth: null}))
							const combo = this._meleeCombos[timestamp]
							const white = combo.startMana.white
							const black = combo.startMana.black
							const rotation = combo.events
							const start = timestamp - this.parser.fight.start_time
							const end = rotation[rotation.length-1].timestamp - this.parser.fight.start_time

							// Prevent null reference errors with broken combos - start with empty values and load with finisher data if exists
							const recommendedActions = (combo.finisher) ? combo.finisher.recommendedActions : []
							const recommendation = (combo.finisher) ? combo.finisher.recommendation : ''

							//console.log(util.inspect(rotation, {showHidden: true, depth: null}))

							return (<Table.Row key={timestamp}>
								<Table.Cell textAlign="center">
									<span style={{marginRight: 5}}>{formatDuration(start / 1000)}</span>
									{<Button
										circular
										compact
										size="mini"
										icon="time"
										onClick={() => this.timeline.show(start, end)}
									/>}
								</Table.Cell>
								<Table.Cell>
									<span style={{whiteSpace: 'nowrap'}}>{white} White | {black} Black</span>
								</Table.Cell>
								<Table.Cell textAlign="center">
									<span>{
										Object.keys(combo.startProcs).map((key) => {
											if (!combo.startProcs[key]) { return }

											switch (key) {
											case 'verstone':
												return (<StatusLink key="verstone" showName={false} {...STATUSES.VERSTONE_READY}/>)
											case 'verfire':
												return (<StatusLink key="verfire" showName={false} {...STATUSES.VERFIRE_READY}/>)
											case 'acceleration':
												return (<StatusLink key="acceleration" showName={false} {...STATUSES.ACCELERATION}/>)
											}
										})
									}</span>
								</Table.Cell>
								<Table.Cell>
									<span style={{whiteSpace: 'nowrap'}}><Rotation events={rotation} /></span>
								</Table.Cell>
								<Table.Cell>
									{
										recommendedActions.map((action) => {
											return (<ActionLink key={action.id} showName={false} {...action}/>)
										})
									}
									<br />{recommendation}
								</Table.Cell>
							</Table.Row>)
						})
					}
				</Table.Body>
			</Table>
		)
	}
}
