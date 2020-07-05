import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'
import Module from 'parser/core/Module'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {getDataBy} from 'data'
import {ActionLink} from 'components/ui/DbLink'
import {Table, Message, Icon, Button, Header} from 'semantic-ui-react'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const ROTATION_IDS = [
	ACTIONS.RAIDEN_THRUST.id,
	ACTIONS.DISEMBOWEL.id,
	ACTIONS.CHAOS_THRUST.id,
	ACTIONS.TRUE_THRUST.id,
	ACTIONS.VORPAL_THRUST.id,
	ACTIONS.FULL_THRUST.id,
]

const PROC_IDS = [ACTIONS.FANG_AND_CLAW.id, ACTIONS.WHEELING_THRUST.id]
const NEXT_COMBO = {
	[ACTIONS.FANG_AND_CLAW.id]: ACTIONS.WHEELING_THRUST.id,
	[ACTIONS.WHEELING_THRUST.id]: ACTIONS.FANG_AND_CLAW.id,
}

const TRUE_NORTH_CHARGES = 2
const TRUE_NORTH_CD_BUFFER = 200
const TRUE_NORTH_CD = ACTIONS.TRUE_NORTH.cooldown * 1000 - TRUE_NORTH_CD_BUFFER

export default class Positionals extends Module {
	static handle = 'positionals'
	static title = t('drg.positionals.title')`Positionals`
	static dependencies = [
		'brokenLog',
		'suggestions',
		'timeline',
	]
	static displayOrder = DISPLAY_ORDER.POSITIONALS

	// tracking raiden thrust procs
	_rtCombos = []
	_currentCombo = null

	// true north tracking
	_tnCharges = 2
	_tnCharging = false

	constructor(...args) {
		super(...args)

		this.addEventHook('cast', {by: 'player', abilityId: ROTATION_IDS}, this._onGcd)
		this.addEventHook('cast', {by: 'player', abilityId: PROC_IDS}, this._onProcGcd)
		this.addEventHook('applybuff', {by: 'player', abilityId: STATUSES.RAIDEN_THRUST_READY.id}, this._procSuccess)
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.TRUE_NORTH.id}, this._tnUsed)
		this.addEventHook('complete', this._onComplete)
	}

	// duplicate code - eventually may want in single location
	createTimelineButton(timestamp) {
		return <Button
			circular
			compact
			icon="time"
			size="small"
			onClick={() => this.timeline.show(timestamp - this.parser.fight.start_time, timestamp - this.parser.fight.start_time)}
			content={this.parser.formatTimestamp(timestamp)}
		/>
	}
	// end duplicate code

	_onGcd() {
		if (!this._currentCombo) {
			return
		}

		// close the window
		// if next action expected is RT this should be added to the combo list, otherwise it was dropped somewhere.
		// if it was an actually broken combo, a different module will yell. otherwise, it was probably due to invuln
		// or downtime and thus not a possible RT proc event.
		if (this._currentCombo.next === ACTIONS.RAIDEN_THRUST.id) {
			this._rtCombos.push(this._currentCombo)
		}
		this._currentCombo = null
	}

	_onProcGcd(event) {
		if (!this._currentCombo) {
			// if we don't have an open combo window, open one
			this._currentCombo = {
				next: NEXT_COMBO[event.ability.guid],
				success: false,
				trueNorthCharges: this._tnCharges,
				time: event.timestamp,
			}
		} else if (this._currentCombo) {
			// add the time
			this._currentCombo.time = event.timestamp

			// set next to RT id for determining if combo completed.
			this._currentCombo.procEvent = event.ability.guid
			this._currentCombo.next = ACTIONS.RAIDEN_THRUST.id

			// update TN charges
			this._currentCombo.trueNorthCharges = this._tnCharges
		}
	}

	// called exactly when the timestamp resolves
	_updateTnCharges() {
		this._tnCharges = Math.min(this._tnCharges + 1, TRUE_NORTH_CHARGES)

		if (this._tnCharges < TRUE_NORTH_CHARGES) {
			// if we're below the max, queue another charge since the cd will keep ticking
			this.addTimestampHook(this.parser.currentTimestamp + TRUE_NORTH_CD, this._updateTnCharges)
		} else {
			this._tnCharging = false
		}
	}

	_tnUsed(event) {
		// remove charge
		this._tnCharges -= 1

		// if we're below 0, clamp
		if (this._tnCharges < 0) {
			// also probably somethin busted here
			this.brokenLog.trigger(this, 'negative true north', (
				<Trans id="drg.positionals.trigger.negative-true-north">
					<ActionLink {...ACTIONS.TRUE_NORTH}/> was cast without any remaining charges detected.
				</Trans>
			))

			this._tnCharges = 0
		}

		// mark next recharge time, using the timestamp hook
		if (!this._tnCharging) {
			this._tnCharging = true
			this.addTimestampHook(event.timestamp + TRUE_NORTH_CD, this._updateTnCharges)
		}
	}

	_procSuccess() {
		// you did it!
		if (this._currentCombo) {
			this._currentCombo.success = true
		}

		// don't actually close until next gcd happens
	}

	_onComplete() {
		const missed = this._rtCombos.filter(combo => !combo.success).length

		this.suggestions.add(
			new TieredSuggestion({
				icon: ACTIONS.RAIDEN_THRUST.icon,
				content: <Trans id="drg.positionals.suggestions.content">Performing the proper positionals for <ActionLink {...ACTIONS.FANG_AND_CLAW} /> and <ActionLink {...ACTIONS.WHEELING_THRUST} /> will do more damage and let you use <ActionLink {...ACTIONS.RAIDEN_THRUST} />. Try to land these positionals, and use <ActionLink {...ACTIONS.TRUE_NORTH} /> if it's available.</Trans>,
				tiers: {
					1: SEVERITY.MINOR,
					10: SEVERITY.MEDIUM,
				},
				value: missed,
				why: <Trans id="drg.positionals.suggestions.why">You missed <Plural value={missed} one="# proc" other="# procs" /> of Raiden Thrust.</Trans>,
			}),
		)
	}

	_checkIcon(success, size = 'large') {
		return success ? <Icon color="green" name="check" size={size} /> : <Icon color="red" name="x" size={size} />
	}

	_procTable() {
		return this._rtCombos.filter(combo => !combo.success).map(combo => {
			const action = getDataBy(ACTIONS, 'id', combo.procEvent)

			return <Table.Row key={combo.time}>
				<Table.Cell>{this.createTimelineButton(combo.time)}</Table.Cell>
				<Table.Cell><ActionLink {...action} /></Table.Cell>
				<Table.Cell>{this._checkIcon(combo.trueNorthCharges > 0, '')} (<Plural id="drg.positionals.tn-charges" value={combo.trueNorthCharges} one="# charge" other="# charges" />)</Table.Cell>
			</Table.Row>
		})
	}

	output() {
		const missed = this._rtCombos.filter(combo => !combo.success).length
		const withTn = this._rtCombos.filter(combo => !combo.success && combo.trueNorthCharges > 0).length

		return <Fragment>
			<Message info>
				<p><Trans id="drg.positionals.analysis.missed"><Icon name="info" /> You missed <strong>{missed}</strong> of <strong>{this._rtCombos.length}</strong> possible <ActionLink {...ACTIONS.RAIDEN_THRUST} /> procs.</Trans></p>
				{missed > 0 && <p><Trans id="drg.positionals.analysis.truenorth">Of these missed procs, <strong>{withTn}</strong> could be handled with <ActionLink {...ACTIONS.TRUE_NORTH} />.</Trans></p>}
			</Message>
			{missed > 0 && <>
				<Header size="small"><Trans id="drg.positionals.table.title">Missed Positionals</Trans></Header>
				<Table>
					<Table.Header>
						<Table.Row key="pos-header">
							<Table.HeaderCell>
								<Trans id="drg.positionals.table.time">Time</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell>
								<Trans id="drg.positionals.table.procact">Action</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell>
								<Trans id="drg.positionals.table.truenorth">True North Status</Trans>
							</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					{this._procTable()}
				</Table>
			</>}
		</Fragment>
	}
}
