import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'
import {
	Table,
	Button,
	Accordion,
	Header,
	Message,
	Icon,
} from 'semantic-ui-react'

import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {getDataBy} from 'data'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
// import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class Jumps extends Module {
	static handle = 'jumps';
	static title = t('drg.jump.title')`Jumps`;
	static dependencies = [
		'checklist',
		'invuln',
		'combatants',
		'timeline',
		'suggestions',
	];

	// theoretically this is different depending on if you're not 80 yet, but
	// it's probably ok to assume this is for current endgame?
	_jumpData = {
		[ACTIONS.HIGH_JUMP.id]: {
			first: 0,
			history: [],
			max: 0,
			cd: ACTIONS.HIGH_JUMP.cooldown * 1000,
		},
		[ACTIONS.SPINESHATTER_DIVE.id]: {
			first: 0,
			history: [],
			max: 0,
			cd: ACTIONS.SPINESHATTER_DIVE.cooldown * 1000,
		},
		[ACTIONS.DRAGONFIRE_DIVE.id]: {
			first: 0,
			history: [],
			max: 0,
			cd: ACTIONS.DRAGONFIRE_DIVE.cooldown * 1000,
		},
	};

	constructor(...args) {
		super(...args)

		this.addHook(
			'cast',
			{
				by: 'player',
				abilityId: [
					ACTIONS.JUMP.id,
					ACTIONS.HIGH_JUMP.id,
					ACTIONS.SPINESHATTER_DIVE.id,
					ACTIONS.DRAGONFIRE_DIVE.id,
				],
			},
			this._onJump
		)
		this.addHook('complete', this._onComplete)
	}

	_computeMaxJumps(start, end, cd, windows) {
		let currentTime = start
		let count = 0

		while (currentTime < end) {
			count += 1
			currentTime += cd

			// check if that falls within a downtime window, if so, current time is now the
			// end of the window
			for (const window of windows) {
				if (window.start <= currentTime && currentTime <= window.end) {
					// inside window, set current to end
					currentTime = window.end
				}
			}
		}

		return count
	}

	_getMaxJumpCount() {
		// downtime windows. we'll do a step through, every time we hit a downtime window and
		// the jump comes off cd we'll hold it until the downtime stops
		const windows = this.invuln.getInvulns()

		for (const actionId in this._jumpData) {
			this._jumpData[actionId].max = this._computeMaxJumps(
				this._jumpData[actionId].first,
				this.parser.fight.end_time,
				this._jumpData[actionId].cd,
				windows
			)
		}
	}

	getActiveDrgBuffs() {
		const active = []

		if (this.combatants.selected.hasStatus(STATUSES.LANCE_CHARGE.id)) {
			active.push(STATUSES.LANCE_CHARGE.id)
		}

		if (this.combatants.selected.hasStatus(STATUSES.BATTLE_LITANY.id)) {
			active.push(STATUSES.BATTLE_LITANY.id)
		}

		if (
			this.combatants.selected.hasStatus(STATUSES.RIGHT_EYE.id) ||
			this.combatants.selected.hasStatus(STATUSES.RIGHT_EYE_SOLO)
		) {
			active.push(STATUSES.RIGHT_EYE.id)
		}

		return active
	}

	_onJump(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (this._jumpData[action.id].first === 0) {
			this._jumpData[action.id].first = this.parser.currentTimestamp
		}

		this._jumpData[action.id].history.push({
			time: this.parser.currentTimestamp,
			buffs: this.getActiveDrgBuffs(),
		})
	}

	_maxJumpCount() {
		let total = 0

		for (const id in this._jumpData) {
			total += this._jumpData[id].max
		}

		return total
	}

	_totalJumpCount() {
		let total = 0

		for (const id in this._jumpData) {
			total += this._jumpData[id].history.length
		}

		return total
	}

	_jumpPct(id) {
		return (this._jumpData[id].history.length / this._jumpData[id].max) * 100
	}

	createTimelineButton(timestamp) {
		return (
			<Button
				circular
				compact
				icon="time"
				size="small"
				onClick={() =>
					this.timeline.show(
						timestamp - this.parser.fight.start_time,
						timestamp - this.parser.fight.start_time
					)
				}
				content={this.parser.formatTimestamp(timestamp)}
			/>
		)
	}

	_jumpAnalysis(key) {
		const history = this._jumpData[key].history

		// this should be correct, + a bit of an epsilon. should be ok for these estimation purposes?
		const duration = this.parser.fight.end_time - this._jumpData[key].first
		const leeway =
			duration - (this._jumpData[key].max - 1) * this._jumpData[key].cd
		let totalDrift = 0

		const rows = history.map((event, idx) => {
			const buffCell = (
				<Table.Cell>
					{event.buffs.map(id => {
						return (
							<StatusLink
								key={id}
								showName={false}
								iconSize="35px"
								{...getDataBy(STATUSES, 'id', id)}
							/>
						)
					})}
				</Table.Cell>
			)

			const delay = idx > 0 ? event.time - history[idx - 1].time : 0
			const drift = idx > 0 ? delay - this._jumpData[key].cd : 0
			totalDrift += drift

			return (
				<Table.Row key={event.time}>
					<Table.Cell>{this.createTimelineButton(event.time)}</Table.Cell>
					<Table.Cell>{this.parser.formatDuration(delay)}</Table.Cell>
					<Table.Cell>{this.parser.formatDuration(drift)}</Table.Cell>
					{buffCell}
				</Table.Row>
			)
		})

		// drift column
		// also should display how much leeway there is to fit all possible jumps in

		return {
			table: (
				<Table>
					<Table.Header>
						<Table.Row key={key + 'header'}>
							<Table.HeaderCell>
								<Trans id="drg.jumptable.time">Time</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell>
								<Trans id="drg.jumptable.delay">CD</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell>
								<Trans id="drg.jumptable.drift">Drift</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell>
								<Trans id="drg.jumptable.statuses">Personal Buffs</Trans>
							</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>{rows}</Table.Body>
				</Table>
			),
			leeway,
			totalDrift,
		}
	}

	_jumpSuggest(action, transid) {
		const suggestID = `drg.jumps.${transid}-suggestion.content`
		const whyID = `drg.jumps.${transid}-suggestion.why`
		const missed =
			this._jumpData[action.id].max - this._jumpData[action.id].history.length
		const missJumpPct = Math.floor(100 - this._jumpPct(action.id))

		this.suggestions.add(
			new TieredSuggestion({
				icon: action.icon,
				content: (
					<Trans id={suggestID}>
						You should be using your <ActionLink {...action} /> as close to on
						cooldown as possible.
					</Trans>
				),
				tiers: {
					1: SEVERITY.MINOR,
					15: SEVERITY.MEDIUM,
					30: SEVERITY.MAJOR,
				},
				value: missJumpPct,
				why: (
					<Trans id={whyID}>
						You could have used <ActionLink {...action} /> {missed} more
						<Plural value={missed} one="time" other="times" />.
					</Trans>
				),
			})
		)
	}

	_onComplete() {
		this._getMaxJumpCount()
		this._jumpSuggest(ACTIONS.HIGH_JUMP, 'hj')
		this._jumpSuggest(ACTIONS.SPINESHATTER_DIVE, 'ssd')
		this._jumpSuggest(ACTIONS.DRAGONFIRE_DIVE, 'dfd')

		this.checklist.add(
			new Rule({
				name: (
					<Trans id="drg.jump.checklist.name">Use Your Jumps on Cooldown</Trans>
				),
				description: (
					<Fragment>
						<Trans id="drg.jump.checklist.description">
							Your jumps should be used as close to on cooldown as possible.
						</Trans>
					</Fragment>
				),
				displayOrder: DISPLAY_ORDER.HIGH_JUMP,
				requirements: [
					new Requirement({
						name: (
							<Trans id="drg.jump.checklist.jump-req.name">
								<ActionLink {...ACTIONS.HIGH_JUMP} /> uses (% of max)
							</Trans>
						),
						percent: () => this._jumpPct(ACTIONS.HIGH_JUMP.id),
					}),
					new Requirement({
						name: (
							<Trans id="drg.jump.checklist.ssd-req.name">
								<ActionLink {...ACTIONS.SPINESHATTER_DIVE} /> uses (% of max)
							</Trans>
						),
						percent: () => this._jumpPct(ACTIONS.SPINESHATTER_DIVE.id),
					}),
					new Requirement({
						name: (
							<Trans id="drg.jump.checklist.dfd-req.name">
								<ActionLink {...ACTIONS.DRAGONFIRE_DIVE} /> uses (% of max)
							</Trans>
						),
						percent: () => this._jumpPct(ACTIONS.DRAGONFIRE_DIVE.id),
					}),
				],
				target: 93,
			})
		)
	}

	_jumpAnalysisSection(action, transid) {
		const data = this._jumpAnalysis(action.id)
		const noteTransID = `drg.jumps.${transid}-section-note`

		return (
			<Fragment>
				<Message attached="top" info>
					<Trans id={noteTransID}>
						<Icon name={'info'} /> You used <ActionLink {...action} />{' '}
						<strong>{this._jumpData[action.id].history.length}</strong> of{' '}
						<strong>{this._jumpData[action.id].max}</strong> possible times.
					</Trans>
				</Message>
				<Accordion
					styled
					fluid
					exclusive={false}
					panels={[
						{
							title: {
								key: `title-${transid}`,
								content: (
									<Fragment>
										<Trans id="drg.jumps.jump-panel-details">Details</Trans>
									</Fragment>
								),
							},
							content: {
								key: `content-${transid}`,
								content: data.table,
							},
						},
					]}
				/>
				<Message attached="bottom" info>
					<Icon name={'clock'} /> Your casts drifted by{' '}
					<strong>{this.parser.formatDuration(data.totalDrift)}</strong>. In
					order to get the most uses, you needed a maximum drift of{' '}
					<strong>{this.parser.formatDuration(data.leeway)}</strong>.
				</Message>
			</Fragment>
		)
	}

	output() {
		return (
			<Fragment>
				<Message>
					<Trans id="drg.jumps.analysis.message">
						You should be using your jumps on cooldown. The number of jumps
						you'll be able to fit will depend on the length of the fight and
						where the boss invulnerability windows are. This analysis estimates
						the number of maximum possible jumps, and shows you how far your
						casts are allowed to drift overall to meet the maximum. This
						analysis might produce very tight maximum drifts, so if you miss one
						jump, don't worry too much about it.
					</Trans>
				</Message>
				<Header size="small">
					<Trans id="drg.jumps.accordion.hj-header">High Jump</Trans>
				</Header>
				{this._jumpAnalysisSection(ACTIONS.HIGH_JUMP, 'hj')}
				<Header size="small">
					<Trans id="drg.jumps.accordion.ssd-header">Spineshatter Dive</Trans>
				</Header>
				{this._jumpAnalysisSection(ACTIONS.SPINESHATTER_DIVE, 'ssd')}
				<Header size="small">
					<Trans id="drg.jumps.accordion.dfd-header">Dragonfire Dive</Trans>
				</Header>
				{this._jumpAnalysisSection(ACTIONS.DRAGONFIRE_DIVE, 'dfd')}
			</Fragment>
		)
	}
}
