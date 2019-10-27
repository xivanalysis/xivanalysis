import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'
import Module from 'parser/core/Module'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {getDataBy} from 'data'
import {ActionLink} from 'components/ui/DbLink'
import {Table, Message, Icon} from 'semantic-ui-react'
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
	static handle = 'positionals';
	static title = t('drg.positionals.title')`Positionals`;
	static dependencies = ['jumps', 'combatants', 'suggestions'];

	// tracking raiden thrust procs
	_rtCombos = [];
	_currentCombo = null;

	// true north tracking
	_tnCharges = 2;
	_nextChargeIn = [];

	constructor(...args) {
		super(...args)

		this.addHook(
			'cast',
			{by: 'player', abilityId: ROTATION_IDS},
			this._onGCD
		)
		this.addHook(
			'cast',
			{by: 'player', abilityId: PROC_IDS},
			this._onProcGCD
		)
		this.addHook(
			'applybuff',
			{by: 'player', abilityId: STATUSES.RAIDEN_THRUST_READY.id},
			this._procSuccess
		)
		this.addHook(
			'cast',
			{by: 'player', abilityId: ACTIONS.TRUE_NORTH.id},
			this._tnUsed
		)
		this.addHook('complete', this._onComplete)
	}

	_onGCD(event) {
		if (this._currentCombo) {
			// did we use the proc? we might not due to invuln windows
			const action = getDataBy(ACTIONS, 'id', event.ability.guid)
			if (action.id === ACTIONS.RAIDEN_THRUST.id) {
				this._rtCombos.used = true
			}

			// close the window
			this._rtCombos.push(this._currentCombo)
			this._currentCombo = null
		}
	}

	_onProcGCD(event) {
		// get action data
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)

		if (!this._currentCombo) {
			// if we don't have an open combo window, open one
			this._currentCombo = {
				next: NEXT_COMBO[action.id],
				success: false,
				used: false,
				trueNorthCharges: this._tnCharges,
				trueNorthCast1: this.combatants.selected.hasStatus(
					STATUSES.TRUE_NORTH.id
				),
				time: event.timestamp,
			}
		} else if (this._currentCombo) {
			// if the action isn't the next expected one, close the current window (not expecting a proc
			// due to broken combo).
			if (this._currentCombo.next !== action.id) {
				// discard, let the broken combo module yell about this
				this._currentCombo = null
			} else {
				// add the time
				this._currentCombo.time = event.timestamp

				// check for true north still active
				this._currentCombo.trueNorthCast2 = this.combatants.selected.hasStatus(
					STATUSES.TRUE_NORTH.id
				)
			}
		}

		this._updateTnCharges(event.timestamp)
	}

	_updateTnCharges(timestamp) {
		// check to see if we're past the required cooldown time
		for (const time of this._nextChargeIn) {
			if (time <= timestamp) {
				this._tnCharges += 1
			}
		}

		// if we're over the max, uhhhhhhhhhh panic?
		if (this._tnCharges > TRUE_NORTH_CHARGES) {
			console.log('DRG Error: True north charges exceeded limit')
		}

		this._nextChargeIn = this._nextChargeIn.filter(time => time > timestamp)
	}

	_tnUsed(event) {
		// remove charge
		this._tnCharges -= 1

		// mark next recharge time
		this._nextChargeIn.push(event.timestamp + TRUE_NORTH_CD)

		// if we're below 0, panic
		if (this._tnCharges < 0) {
			console.log('DRG Error: True north charges went below 0')
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
				content: (
					<Trans id="drg.positionals.suggestions.content">
						Performing the proper positionals for{' '}
						<ActionLink {...ACTIONS.FANG_AND_CLAW} /> and{' '}
						<ActionLink {...ACTIONS.WHEELING_THRUST} /> will do more damage and
						let you use <ActionLink {...ACTIONS.RAIDEN_THRUST} />. Try to land
						these positionals, and use <ActionLink {...ACTIONS.TRUE_NORTH} /> if
						it's available.
					</Trans>
				),
				tiers: {
					1: SEVERITY.MINOR,
					10: SEVERITY.MEDIUM,
				},
				value: missed,
				why: (
					<Trans id="drg.positionals.suggestions.why">
						You missed {missed}{' '}
						<Plural value={missed} one="proc" other="procs" /> of Raiden Thrust.
					</Trans>
				),
			})
		)
	}

	_checkIcon(success, size = 'large') {
		return success ? (
			<Icon color="green" name="check" size={size} />
		) : (
			<Icon color="red" name="x" size={size} />
		)
	}

	_procTable() {
		return this._rtCombos.map(combo => {
			const action = getDataBy(ACTIONS, 'id', combo.next)

			return (
				<Table.Row key={combo.time}>
					<Table.Cell>{this.jumps.createTimelineButton(combo.time)}</Table.Cell>
					<Table.Cell>
						<ActionLink {...action} />
					</Table.Cell>
					<Table.Cell
						textAlign="center"
						positive={combo.success}
						negative={!combo.success}
					>
						{this._checkIcon(combo.success)}
					</Table.Cell>
					<Table.Cell textAlign="center">
						{combo.trueNorthCast1 ? <Icon color="green" name="check" /> : ''}
					</Table.Cell>
					<Table.Cell textAlign="center">
						{combo.trueNorthCast2 ? <Icon color="green" name="check" /> : ''}
					</Table.Cell>
					<Table.Cell textAlign="center">
						{this._checkIcon(combo.trueNorthCharges > 0, '')} (
						{combo.trueNorthCharges}{' '}
						<Plural
							value={combo.trueNorthCharges}
							one="charge"
							other="charges"
						/>
						)
					</Table.Cell>
				</Table.Row>
			)
		})
	}

	output() {
		const missed = this._rtCombos.filter(combo => !combo.success).length

		return (
			<Fragment>
				<Message>
					<Trans id="drg.positionals.analysis.message">
						Being in the correct position when using{' '}
						<ActionLink {...ACTIONS.WHEELING_THRUST} /> and{' '}
						<ActionLink {...ACTIONS.FANG_AND_CLAW} /> will allow you to use{' '}
						<ActionLink {...ACTIONS.RAIDEN_THRUST} /> instead of{' '}
						<ActionLink {...ACTIONS.TRUE_THRUST} />. You should be trying to
						proc this ability as much as possible, relying on{' '}
						<ActionLink {...ACTIONS.TRUE_NORTH} /> in situations where you
						cannot reach the proper position. Landing every single one of these
						positionals boosts your damage output by ~4%. The table below
						displays all positionals, and whether or not{' '}
						<ActionLink {...ACTIONS.TRUE_NORTH} /> was available to use.
					</Trans>
				</Message>
				<Message info>
					<Trans id="drg.positionals.analysis.missed">
						<Icon name="info" />
						You missed {missed} of {this._rtCombos.length} possible{' '}
						<ActionLink {...ACTIONS.RAIDEN_THRUST} /> procs.
						{missed > 0 ? (
							<>
								Of these missed procs,{' '}
								<strong>
									{
										this._rtCombos.filter(
											combo => !combo.success && combo.trueNorthCharges > 0
										).length
									}
								</strong>{' '}
								could be handled with <ActionLink {...ACTIONS.TRUE_NORTH} />{' '}
							</>
						) : (
							''
						)}
					</Trans>
				</Message>
				<Table>
					<Table.Header>
						<Table.Row key="pos-header">
							<Table.HeaderCell rowSpan="2">
								<Trans id="drg.positionals.table.time">Time</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell rowSpan="2">
								<Trans id="drg.positionals.table.procact">Final Action</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell rowSpan="2">
								<Trans id="drg.positionals.table.success">Success</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell colSpan="3" textAlign="center">
								<Trans id="drg.positionals.table.truenorth">True North</Trans>
							</Table.HeaderCell>
						</Table.Row>
						<Table.Row>
							<Table.HeaderCell textAlign="center">
								<Trans id="drg.positionals.table.tn1">Cast 1</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell textAlign="center">
								<Trans id="drg.positionals.table.tn2">Cast 2</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell textAlign="center">
								<Trans id="drg.positionals.table.tnavail">Available</Trans>
							</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					{this._procTable()}
				</Table>
			</Fragment>
		)
	}
}
