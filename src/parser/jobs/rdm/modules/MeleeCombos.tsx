import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import JOBS from 'data/JOBS'
import {Event, Events} from 'event'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {AllowedGcdsOnlyEvaluator, ActionWindow, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, LimitedActionsEvaluator, EvaluationOutput, EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import { History, HistoryEntry } from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {Data} from 'parser/core/modules/Data'
import {Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import Gauge from 'parser/jobs/rdm/modules/Gauge'
import {DualStatistic} from 'parser/jobs/rdm/statistics/DualStatistic'
import React, {Fragment} from 'react'
import {isSuccessfulHit} from 'utilities'
import {Button, Table} from 'semantic-ui-react'
import Rotation from 'components/ui/Rotation'
import {ensureArray, isDefined} from 'utilities'
import { RotationTable, RotationTableNotesMap, RotationTableTargetData } from 'components/ui/RotationTable'
import { Action } from 'data/ACTIONS/type'

type MeleeCombo = {
	events: Array<Events['action']>,
	lastAction: Events['action'],
	finisher: {
		 used: number,
		 recommendedActions: Action[],
		 recommendation: JSX.Element
	 }
	broken: boolean,
	initialized: boolean,
}

interface ManaActions {
	proc: number,
	dualcast: number,
	finisher: number,
}

interface ManaState {
	amount: number,
	procReady: boolean,
	actions: ManaActions,
}

export default class MeleeCombos extends Analyser {
	static override handle = 'mlc'
	static override title = t('rdm.meleecombos.title')`Melee Combos`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline
	@dependency private cooldowns!: Cooldowns
	@dependency private actors!: Actors
	@dependency private gauge!: Gauge

	private readonly _finishers = [
		this.data.actions.VERHOLY.id,
		this.data.actions.VERFLARE.id
	]
	private readonly _severityWastedFinisher = {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	}
	private _whiteManaActions: ManaActions = {
		proc: this.data.actions.VERSTONE.id,
		dualcast: this.data.actions.VERAERO.id,
		finisher: this.data.actions.VERHOLY.id,
	}
	private _blackManaActions: ManaActions = {
		proc: this.data.actions.VERFIRE.id,
		dualcast: this.data.actions.VERTHUNDER.id,
		finisher: this.data.actions.VERFLARE.id,
	}
	private readonly _ignoreFinisherProcsManaThreshold = 4
	//4 seconds for 2 GCD minus a 1 second window to activate before finisher
	private readonly _delayAccelerationAvailableThreshold = 4
	private _meleeCombos = new History<MeleeCombo>(() => ({
		  events: [],
		  lastAction: {} as Events['action'],
		 finisher: {
			 used: 0,
			 recommendedActions: [],
		 recommendation: <Trans></Trans>
		 },
		broken: false,
		initialized: false, }))
	private _incorrectFinishers = {
		verholy: 0,
		verflare: 0,
		delay: 0,
	}
	/**
	 * The evaluators used to generate suggestions and output for the windows.
	 */
	 private evaluators: WindowEvaluator[] = []

	override initialise() {
		super.initialise()

		this.addEventHook(
			filter<Event>()
				.type('action')
				.source(this.parser.actor.id),
			this.onCast)
		this.addEventHook(
			filter<Event>()
				.type('death')
				.actor(this.parser.actor.id),
			this.onDeath
		)
		this.addEventHook(
			filter<Event>()
			.type('complete'),
			this.onComplete
		)
	}

	private onCast(event: Events['action']) {
		const action = this.data.getAction(event.action)

		if (action == null) {
			return
		}

		if (action.combo) {
			if (action.combo.start) {
				this.breakComboIfExists(event.timestamp)
				this.startCombo(event)
			} else {
				if (this._meleeCombos.getCurrent() == null) {
					return
				}

				if (action.combo.from) {
					const fromOptions = Array.isArray(action.combo.from) ? action.combo.from : [action.combo.from]
					const current = this._meleeCombos.getCurrent()
					if (current) {
					if (!fromOptions.includes(current.data.lastAction.action ?? 0)) {
						current.data.broken = true
						this.endCombo(event.timestamp)
					} else {
						current.data.events.push(event)
						current.data.lastAction = event
						if (action.combo.end) {
							current.data.finisher.used = event.action
							this.handleFinisher()
							this.endCombo(event.timestamp)
						}
					}
				}
				}
			}
		}

		if (action.breaksCombo) {
			this.breakComboIfExists(event.timestamp)
		}
	}

	private onDeath(event: Events['death']) {
		this.breakComboIfExists(event.timestamp)
	}

	private onComplete(event: Events['complete']) {
		// Finish any open combos
		this.breakComboIfExists(event.timestamp)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.VERHOLY.icon,
			content: <Trans id="rdm.gauge.suggestions.wastedverholy.content">
				You should use <ActionLink {...this.data.actions.VERHOLY} /> over <ActionLink {...this.data.actions.VERFLARE} /> in the following situations in order of importance
				<ol>
					<li>When your white mana is lower</li>
					<li>Your mana is even and you have <StatusLink {...this.data.statuses.VERFIRE_READY} /> (Use <ActionLink {...this.data.actions.ACCELERATION} /> if available!)</li>
					<li>White mana is higher by 9 or less and <ActionLink {...this.data.actions.ACCELERATION} /> is available with <StatusLink {...this.data.statuses.VERFIRE_READY} /></li>
				</ol>
			</Trans>,
			why: <Plural id="rdm.gauge.suggestions.wastedverholy.why" value={this._incorrectFinishers.verflare} one="# Verstone cast was lost due to using Verflare incorrectly" other="# Verstone casts were lost due to using Verflare incorrectly" />,
			tiers: this._severityWastedFinisher,
			value: this._incorrectFinishers.verflare,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.VERFLARE.icon,
			content: <Trans id="rdm.gauge.suggestions.wastedverflare.content">
				You should use <ActionLink {...this.data.actions.VERFLARE} /> over <ActionLink {...this.data.actions.VERHOLY}/> in the following situations in order of importance
				<ol>
					<li>When your black mana is lower</li>
					<li>Your mana is even and you have <StatusLink {...this.data.statuses.VERSTONE_READY} /> (Use <ActionLink {...this.data.actions.ACCELERATION} /> if available!)</li>
					<li>Black mana is higher by 9 or less and <ActionLink {...this.data.actions.ACCELERATION} /> is available with <StatusLink {...this.data.statuses.VERSTONE_READY} /></li>
				</ol>
			</Trans>,
			why: <Plural id="rdm.gauge.suggestions.wastedverflare.why" value={this._incorrectFinishers.verholy} one="# Verfire cast was lost due to using Verholy incorrectly" other="# Verfire casts were lost due to using Verholy incorrectly" />,
			tiers: this._severityWastedFinisher,
			value: this._incorrectFinishers.verholy,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.VERSTONE.icon,
			content: <Trans id="rdm.gauge.suggestions.wastedprocs.content">
				Do not enter your combo with your finisher's proc up when <ActionLink {...this.data.actions.ACCELERATION}/> is down, consider dumping a proc before entering the melee combo as long as you waste less than 8 mana to overcapping
			</Trans>,
			why: <Plural id="rdm.gauge.suggestions.wastedprocs.why" value={this._incorrectFinishers.delay} one="# Proc cast was lost due to entering the melee combo with the finisher proc up." other="# Procs casts were lost due to entering the melee combo with the finisher proc up." />,
			tiers: this._severityWastedFinisher,
			value: this._incorrectFinishers.delay,
		}))
	}

	private mapHistoryActions(): Array<HistoryEntry<EvaluatedAction[]>> {
		return this._meleeCombos.entries
			.map(entry => ({start: entry.start,
				end: entry.end,
				data: entry.data.events
					.map(ev => {
						const action = this.data.getAction(ev.action)
						if (action == null) { return undefined }
						return {...ev, action}
					})
					.filter(isDefined),
			}))
	}

	override output() {
		if (this._meleeCombos.entries.length === 0) { return undefined }

		const actionHistory = this.mapHistoryActions()
		const evalColumns: EvaluationOutput[]  = []
		for (const ev of this.evaluators) {
			const maybeColumns = ev.output(actionHistory)
			if (maybeColumns == null) { continue }
			for (const column of ensureArray(maybeColumns)) {
				evalColumns.push(column)
			}
		}

		const rotationTargets = evalColumns.filter(column => column.format === 'table').map(column => column.header)
		const notesData = evalColumns.filter(column => column.format === 'notes').map(column => column.header)
		const rotationData = this._meleeCombos.entries
			.map((window, idx) => {
				const targetsData: RotationTableTargetData = {}
				const notesMap: RotationTableNotesMap = {}
				evalColumns.forEach(column => {
					if (typeof column.header.accessor !== 'string') { return }
					const colName = column.header.accessor
					if (column.format === 'table') {
						targetsData[colName] = column.rows[idx]
					} else {
						notesMap[colName] = column.rows[idx]
					}
				})
				return {
					start: window.start - this.parser.pull.timestamp,
					end: (window.end ?? window.start) - this.parser.pull.timestamp,
					targetsData,
					rotation: window.data.events.map(event => { return {action: event.action} }),
					notesMap,
				}
			})

		return <RotationTable
			targets={rotationTargets}
			data={rotationData}
			notes={notesData}
			onGoto={this.timeline.show}
			headerTitle={<Trans id="rdm.meleecombos.rotationtable.content"/>}
		/>
	}

	private startCombo(event: Events['action']) {
		this._meleeCombos.openNew(event.timestamp)
		const current = this._meleeCombos.getCurrent()
		if (current) {
			current.data.events.push(event)
			current.data.lastAction = event
		}
	}

	private breakComboIfExists(timestamp: number) {
		const current = this._meleeCombos.getCurrent()
		if (current) {
			current.data.broken = true
			this.endCombo(timestamp)
		}
	}

	private endCombo(timestamp: number) {
		this._meleeCombos.closeCurrent(timestamp)
	}

	private handleFinisher() {
		const combo = this._meleeCombos.getCurrent()
		if (!combo){return}

		const whiteState = {
			amount: this.gauge.getWhiteManaAt(combo.start),
			procReady: this.actors.current.at(combo.start).hasStatus(this._whiteManaActions.proc),
			actions: this._whiteManaActions
		} as ManaState
		const blackState = {
			amount: this.gauge.getBlackManaAt(combo.start),
			procReady: this.actors.current.at(combo.start).hasStatus(this._blackManaActions.proc),
			actions: this._blackManaActions
		} as ManaState
		const finisherAction = this.data.getAction(combo.data.finisher.used)
		if (finisherAction == null) {
			return
		}

		let recommendedFinisher = null
		if (whiteState.amount < blackState.amount) {
			recommendedFinisher = this.outOfBalanceFinisher(whiteState, blackState, combo.start)
		} else if (blackState.amount < whiteState.amount) {
			recommendedFinisher = this.outOfBalanceFinisher(blackState, whiteState, combo.start)
		} else {
			recommendedFinisher = this.inBalanceFinisher(blackState, whiteState, combo.start)
		}

		if (recommendedFinisher instanceof Array) {
			if (recommendedFinisher === this._finishers) {
				// a recommendation of both finishers means ignore the finisher, either one is valid
				combo.data.finisher.recommendedActions.push(finisherAction)
			} else {
				// a recommendation of an array of actions is to delay the combo
				Array.prototype.push.apply(combo.data.finisher.recommendedActions, recommendedFinisher)
				this._incorrectFinishers.delay++
				combo.data.finisher.recommendation = <Trans id="rdm.meleecombos.recommendation.delay">Delay your melee combo to guarantee a proc from your finisher, if you will lose {this._ignoreFinisherProcsManaThreshold} or less mana to overcapping.</Trans>
			}
		} else {
			const finisherAction = this.data.getAction(recommendedFinisher)
			if (finisherAction == null) {
				return
			}
			// A specific finisher was recommended
			combo.data.finisher.recommendedActions.push(finisherAction)
			if (combo.data.finisher.used !== recommendedFinisher) {
				// wrong finisher was used, add an incorrect finisher tally
				if (combo.data.finisher.used === this.data.actions.VERHOLY.id) {
					this._incorrectFinishers.verholy++
				}
				if (combo.data.finisher.used === this.data.actions.VERFLARE.id) {
					this._incorrectFinishers.verflare++
				}
				combo.data.finisher.recommendation = <Trans id="rdm.meleecombos.recommendation.incorrect">See the suggestions section for finisher guidelines.</Trans>
			}
		}
	}

	private outOfBalanceFinisher(lowerManaState: ManaState, higherManaState: ManaState, comboStart: number) {
		const isAccelerationUp = this.actors.current.at(comboStart).hasStatus(this.data.statuses.ACCELERATION.id)

		if (!lowerManaState.procReady) {
			// no proc of the lower mana spell, use that finisher
			return lowerManaState.actions.finisher
		}

		const comboDelayResults = this.manaLossToDelayCombo(lowerManaState, higherManaState, comboStart)
		if (!higherManaState.procReady) {
			// no proc of the higher mana spell, check accleration and potential out of balance to make recommendation
			const finisherManaGain = (this.gauge._gaugeModifiers.get(higherManaState.actions.finisher)?.white ?? 0) || (this.gauge._gaugeModifiers.get(higherManaState.actions.finisher)?.black ?? 0)
			if (higherManaState.amount - lowerManaState.amount + finisherManaGain > this.gauge._manaDifferenceThreshold) {
				// We will go out of balance if we use the finisher of the higher mana, check to see if delaying combo would have been better
				if (comboDelayResults !== null && comboDelayResults.manaLoss <= this._ignoreFinisherProcsManaThreshold) {
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
			if (comboDelayResults !== null && comboDelayResults.manaLoss <= this._ignoreFinisherProcsManaThreshold) {
				// return null (delay combo) if below threshold
				return comboDelayResults.finisher
			}
			// If delaying finisher isn't worthwhile, but we won't go out of balance by using the higherManaFinisher, fishing for a 20% proc is better than overwriting the existing proc
			return higherManaState.actions.finisher
		}

		// Both procs are up, check to see if delaying combo would have been better
		if (comboDelayResults !== null && comboDelayResults.manaLoss <= this._ignoreFinisherProcsManaThreshold) {
			// return null (delay combo) if below threshold
			return comboDelayResults.finisher
		}
		// return both finishers (finisher doesn't matter) if above the threshold where the mana loss from delaying outweighs benefit of forced proc
		return this._finishers
	}

	private inBalanceFinisher(firstManaState: ManaState, secondManaState: ManaState, comboStart: number) {
		const isAccelerationUp = this.actors.current.at(comboStart).hasStatus(this.data.statuses.ACCELERATION.id)

		if (!isAccelerationUp || (firstManaState.procReady && secondManaState.procReady)) {
			// Acceleration is not up or both procs are up, check to see if delaying combo would have been better
			const comboDelayResults = this.manaLossToDelayCombo(firstManaState, secondManaState, comboStart)
			// Safeguard against null return if no valid delays were found
			if (comboDelayResults !== null && comboDelayResults.manaLoss <= this._ignoreFinisherProcsManaThreshold) {
				// return null (delay combo) if below threshold
				return comboDelayResults.finisher
			}
		}

		// Acceleration is up or delaying combo is not better, return finisher of proc that isn't available (fishing for 20% is better than overwriting a proc or delaying)
		if (!firstManaState.procReady && !secondManaState.procReady) {
			// Neither proc is up - return both finishers (finisher doesn't matter)
			return this._finishers
		}
		if (!firstManaState.procReady) {
			return firstManaState.actions.finisher
		}
		if (!secondManaState.procReady) {
			return secondManaState.actions.finisher
		}
		// Both procs are up and it's not worthwhile to delay combo, return both finishers (finisher doesn't matter)
		return this._finishers
	}

	private manaLossToDelayCombo(lowerManaState: ManaState, higherManaState: ManaState, comboStart: number) {
		const possibleDelays = []

		if (lowerManaState.procReady) {
			/* Case: lowerManaProc is available, "clear" the proc by casting Lower Proc + Higher Dualcast
				This case is valid whether or not the higherManaProc exists
				Overwriting the higherManaProc with the 50% chance while dumping is no net loss of procs compared to not delaying */
			// Net benefit: +1 proc gained (lowerMana) for effective potency of +34.8 (8 Mana)
			let newLowerMana = lowerManaState.amount + (this.gauge._gaugeModifiers.get(lowerManaState.actions.proc)?.white ?? 0) || (this.gauge._gaugeModifiers.get(lowerManaState.actions.proc)?.black ?? 0)
			let newHigherMana = higherManaState.amount + (this.gauge._gaugeModifiers.get(higherManaState.actions.dualcast)?.white ?? 0) || (this.gauge._gaugeModifiers.get(higherManaState.actions.dualcast)?.black ?? 0)

			// Determine how much mana would be wasted to cap with this delay, then adjust post-delay mana totals to cap before further comparisons
			const manaLoss = Math.max(newLowerMana - this.gauge._manaCap, 0) + Math.max(newHigherMana - this.gauge._manaCap, 0)
			newLowerMana = Math.min(newLowerMana, this.gauge._manaCap)
			newHigherMana = Math.min(newHigherMana, this.gauge._manaCap)

			if (newLowerMana < newHigherMana) {
				// The proc we just cleared is still the lower mana, valid clear option, push onto stack
				possibleDelays.push({
					finisher: [lowerManaState.actions.proc, higherManaState.actions.dualcast, lowerManaState.actions.finisher],
					manaLoss: manaLoss,
				})
			} else {
				// Verify that using the finisher of the proc we just cleared won't put us out of balance at the end
				const finisherManaGain = (this.gauge._gaugeModifiers.get(lowerManaState.actions.finisher)?.white ?? 0) || (this.gauge._gaugeModifiers.get(lowerManaState.actions.finisher)?.black ?? 0)
				if ((newLowerMana + finisherManaGain - newHigherMana) > this.gauge._manaDifferenceThreshold) {
					// The proc we just cleared will result in equal mana or the cleared proc being higher but without putting us out of balance, check to see if acceleration would be available
					const accelerationAvailable = (this.actors.current.at(comboStart).hasStatus(this.data.statuses.ACCELERATION.id) || this.cooldowns.remaining('ACCELERATION') <= this._delayAccelerationAvailableThreshold)
					if (accelerationAvailable) {
						possibleDelays.push({
							finisher: [lowerManaState.actions.proc, higherManaState.actions.dualcast, this.data.actions.ACCELERATION, lowerManaState.actions.finisher],
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
				let newLowerMana = lowerManaState.amount + ((this.gauge._gaugeModifiers.get(lowerManaState.actions.proc)?.white ?? 0) || (this.gauge._gaugeModifiers.get(lowerManaState.actions.proc)?.black ?? 0)) + ((this.gauge._gaugeModifiers.get(lowerManaState.actions.dualcast)?.white ?? 0) || (this.gauge._gaugeModifiers.get(lowerManaState.actions.dualcast)?.black ?? 0))
				let newHigherMana = higherManaState.amount

				// Determine how much mana would be wasted to cap with this delay, then adjust post-delay mana totals to cap before further comparisons
				const manaLoss = Math.max(newLowerMana - this.gauge._manaCap, 0) + Math.max(newHigherMana - this.gauge._manaCap, 0)
				newLowerMana = Math.min(newLowerMana, this.gauge._manaCap)
				newHigherMana = Math.min(newHigherMana, this.gauge._manaCap)

				if (newHigherMana < newLowerMana) {
					// Mana rebalancing resulted in the original higherMana becoming the lower total (guaranteed proc), valid option, push onto stack
					possibleDelays.push({
						finisher: [lowerManaState.actions.proc, lowerManaState.actions.dualcast, higherManaState.actions.finisher],
						manaLoss: manaLoss,
					})
				} else {
					// Verify that using the finisher of higherMana won't put us out of balance at the end
					const finisherManaGain = (this.gauge._gaugeModifiers.get(higherManaState.actions.finisher)?.white ?? 0) || (this.gauge._gaugeModifiers.get(higherManaState.actions.finisher)?.black ?? 0)
					if (!((newHigherMana + finisherManaGain - newLowerMana) > this.gauge._manaDifferenceThreshold)) {
						// This is a net gain whether or not acceleration would be available - we can now fish for an additional proc of higherMana, push onto stack
						possibleDelays.push({
							finisher: [lowerManaState.actions.proc, lowerManaState.actions.dualcast, this.data.actions.ACCELERATION, higherManaState.actions.finisher],
							manaLoss: manaLoss,
						})
					}
				}
			}
		} else {
			// These cases should only be hit if lowerMana == higherMana (we were in balance at start of combo), to test benefits of delaying combo to imbalance mana
			// If lowerManaProc isn't available and lowerMana < higherMana, recommendation will always be the lowerManaActions.finisher
			if (higherManaState.procReady) { // eslint-disable-line no-lonely-if
				let newLowerMana = lowerManaState.amount + ((this.gauge._gaugeModifiers.get(lowerManaState.actions.dualcast)?.white ?? 0) || (this.gauge._gaugeModifiers.get(lowerManaState.actions.dualcast)?.black ?? 0))
				let newHigherMana = higherManaState.amount + ((this.gauge._gaugeModifiers.get(higherManaState.actions.proc)?.white ?? 0) || (this.gauge._gaugeModifiers.get(higherManaState.actions.proc)?.black ?? 0))

				// Determine how much mana would be wasted to cap with this delay, then adjust post-delay mana totals to cap before further comparisons
				const manaLoss = Math.max(newLowerMana - this.gauge._manaCap, 0) + Math.max(newHigherMana - this.gauge._manaCap, 0)
				newLowerMana = Math.min(newLowerMana, this.gauge._manaCap)
				newHigherMana = Math.min(newHigherMana, this.gauge._manaCap)

				if (newHigherMana < newLowerMana) {
					// Mana rebalancing resulted in the original higherMana becoming the lower total (guaranteed proc), valid option, push onto stack
					possibleDelays.push({
						finisher: [higherManaState.actions.proc, lowerManaState.actions.dualcast, higherManaState.actions.finisher],
						manaLoss: manaLoss,
					})
				}
			} else {
				// Neither proc is up, check with using Jolt  + higherMana's dualcast spell to delay so that lowerMana will get guaranteed proc
				let newLowerMana = lowerManaState.amount + (this.gauge._gaugeModifiers.get(this.data.actions.JOLT_II.id)?.white ?? 0)
				let newHigherMana = higherManaState.amount + (this.gauge._gaugeModifiers.get(this.data.actions.JOLT_II.id)?.black ?? 0) + ((this.gauge._gaugeModifiers.get(higherManaState.actions.dualcast)?.white ?? 0) || (this.gauge._gaugeModifiers.get(higherManaState.actions.dualcast)?.black ?? 0))
				const firstDelaySkill = this.data.actions.JOLT_II

				// Determine how much mana would be wasted to cap with this delay, then adjust post-delay mana totals to cap before further comparisons
				const manaLoss = Math.max(newLowerMana - this.gauge._manaCap, 0) + Math.max(newHigherMana - this.gauge._manaCap, 0)
				newLowerMana = Math.min(newLowerMana, this.gauge._manaCap)
				newHigherMana = Math.min(newHigherMana, this.gauge._manaCap)
				if (newLowerMana < newHigherMana) {
					// Mana rebalancing resulted in the original higherMana becoming the lower total (guaranteed proc), valid option, push onto stack
					possibleDelays.push({
						finisher: [firstDelaySkill, lowerManaState.actions.dualcast, higherManaState.actions.finisher],
						manaLoss: manaLoss,
					})
				} else {
					// Check if using Jolt  + lowerMana's dualcast spell to delay so that higherMana will get guaranteed proc
					let newLowerMana = lowerManaState.amount + (this.gauge._gaugeModifiers.get(this.data.actions.JOLT_II.id)?.white ?? 0) + ((this.gauge._gaugeModifiers.get(lowerManaState.actions.dualcast)?.white ?? 0) || (this.gauge._gaugeModifiers.get(lowerManaState.actions.dualcast)?.black ?? 0))
					let newHigherMana = higherManaState.amount + (this.gauge._gaugeModifiers.get(this.data.actions.JOLT_II.id)?.black ?? 0)
					const firstDelaySkill = this.data.actions.JOLT_II

					// Determine how much mana would be wasted to cap with this delay, then adjust post-delay mana totals to cap before further comparisons
					const manaLoss = Math.max(newLowerMana - this.gauge._manaCap, 0) + Math.max(newHigherMana - this.gauge._manaCap, 0)
					newLowerMana = Math.min(newLowerMana, this.gauge._manaCap)
					newHigherMana = Math.min(newHigherMana, this.gauge._manaCap)
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
}
