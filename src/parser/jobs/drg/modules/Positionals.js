import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'
import Module from 'parser/core/Module'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {getDataBy} from 'data'
import {ActionLink} from 'components/ui/DbLink'
import {Table, Message, Icon, Button} from 'semantic-ui-react'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

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
const TRUE_NORTH_CD = ACTIONS.TRUE_NORTH.cooldown * 1000

export default class Positionals extends Module {
	static handle = 'positionals'
	static title = t('drg.positionals.title')`Positionals`
	static dependencies = [
		'combatants',
		'suggestions',
	]

	// tracking raiden thrust procs
	_rtCombos = []
	_currentCombo = null

	// true north tracking
	_tnCharges = 2
	_nextChargeIn = null

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player', abilityId: ROTATION_IDS}, this._onGcd)
		this.addHook('cast', {by: 'player', abilityId: PROC_IDS}, this._onProcGcd)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.RAIDEN_THRUST_READY.id}, this._procSuccess)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.TRUE_NORTH.id}, this._tnUsed)
		this.addHook('complete', this._onComplete)
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

	_onGcd(event) {
		if (!this._currentCombo) {
			return
		}

		// did we use the proc? we might not due to invuln windows
		if (event.ability.guid === ACTIONS.RAIDEN_THRUST.id) {
			this._rtCombos.used = true
		}

		// close the window
		this._rtCombos.push(this._currentCombo)
		this._currentCombo = null
	}

	_onProcGcd(event) {
		if (!this._currentCombo) {
			// if we don't have an open combo window, open one
			this._currentCombo = {
				next: NEXT_COMBO[event.ability.guid],
				success: false,
				used: false,
				trueNorthCharges: this._tnCharges,
				trueNorthCast1: this.combatants.selected.hasStatus(STATUSES.TRUE_NORTH.id),
				time: event.timestamp,
			}
		} else if (this._currentCombo) {
			// add the time
			this._currentCombo.time = event.timestamp

			// check for true north still active
			this._currentCombo.trueNorthCast2 = this.combatants.selected.hasStatus(STATUSES.TRUE_NORTH.id)
		}
	}

	// called exactly when the timestamp resolves
	_updateTnCharges() {
		this._tnCharges = Math.min(this._tnCharges + 1, TRUE_NORTH_CHARGES)

		if (this._tnCharges < TRUE_NORTH_CHARGES) {
			// if we're below the max, queue another charge since the cd will keep ticking
			this.addTimestampHook(this.parser.currentTimestamp + TRUE_NORTH_CD, this._updateTnCharges)
		}
	}

	_tnUsed(event) {
		// remove charge
		this._tnCharges -= 1

		// if we're below 0, clamp
		if (this._tnCharges < 0) {
			this._tnCharges = 0
		}

		// mark next recharge time, using the timestamp hook
		if (!this._nextChargeIn) {
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
		// replace the below with this to filter out successful combos
		// return this._rtCombos.filter(combo => !combo.success).map(combo => {
		return this._rtCombos.map(combo => {
			const action = getDataBy(ACTIONS, 'id', combo.next)

			return <Table.Row key={combo.time}>
				<Table.Cell>{this.createTimelineButton(combo.time)}</Table.Cell>
				<Table.Cell><ActionLink {...action} /></Table.Cell>
				<Table.Cell textAlign="center" positive={combo.success} negative={!combo.success}>{this._checkIcon(combo.success)}</Table.Cell>
				<Table.Cell textAlign="center">{this._checkIcon(combo.trueNorthCharges > 0, '')} (<Plural id="drg.positionals.tn-charges" value={combo.trueNorthCharges} one="# charge" other="# charges" />)</Table.Cell>
			</Table.Row>
		})
	}

	output() {
		const missed = this._rtCombos.filter(combo => !combo.success).length

		return <Fragment>
			<Message>
				<Trans id="drg.positionals.analysis.message">Being in the correct position when using <ActionLink {...ACTIONS.WHEELING_THRUST} /> and <ActionLink {...ACTIONS.FANG_AND_CLAW} /> will allow you to use <ActionLink {...ACTIONS.RAIDEN_THRUST} /> instead of <ActionLink {...ACTIONS.TRUE_THRUST} />. You should be trying to proc this ability as much as possible, relying on <ActionLink {...ACTIONS.TRUE_NORTH} /> in situations where you cannot reach the proper position. Landing every single one of these positionals boosts your damage output by ~4%. The table below displays all positionals, and whether or not <ActionLink {...ACTIONS.TRUE_NORTH} /> was available to use.</Trans>
			</Message>
			<Message info>
				<Trans id="drg.positionals.analysis.missed"><Icon name="info" /> You missed {missed} of {this._rtCombos.length} possible <ActionLink {...ACTIONS.RAIDEN_THRUST} /> procs.
					{missed > 0 ? (
						<>
							Of these missed procs, <strong>{this._rtCombos.filter(combo => !combo.success && combo.trueNorthCharges > 0).length}</strong> could be handled with <ActionLink {...ACTIONS.TRUE_NORTH} />
						</>
					) : ('')}
				</Trans>
			</Message>
			<Table>
				<Table.Header>
					<Table.Row key="pos-header">
						<Table.HeaderCell>
							<Trans id="drg.positionals.table.time">Time</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell>
							<Trans id="drg.positionals.table.procact">Final Action</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell>
							<Trans id="drg.positionals.table.success">Success</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell>
							<Trans id="drg.positionals.table.truenorth">True North Available?</Trans>
						</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				{this._procTable()}
			</Table>
		</Fragment>
	}
}
