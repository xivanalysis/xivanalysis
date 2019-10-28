import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'
import {Header, Message, Icon, Table} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BAD_LIFE_SURGE_CONSUMERS = [
	ACTIONS.TRUE_THRUST.id,
	ACTIONS.RAIDEN_THRUST.id,
	ACTIONS.VORPAL_THRUST.id,
	ACTIONS.DISEMBOWEL.id,
	ACTIONS.CHAOS_THRUST.id,
	ACTIONS.PIERCING_TALON.id,
	ACTIONS.DOOM_SPIKE.id,
	ACTIONS.SONIC_THRUST.id,
	ACTIONS.COERTHAN_TORMENT.id,
]
const FINAL_COMBO_HITS = [
	ACTIONS.FANG_AND_CLAW.id,
	ACTIONS.WHEELING_THRUST.id,
]
const BAD_BUFF_ACTIONS = [
	ACTIONS.CHAOS_THRUST.id,
	ACTIONS.FULL_THRUST.id,
]
const STATUS_MAP = {
	[ACTIONS.LANCE_CHARGE.id]: STATUSES.LANCE_CHARGE.id,
	[ACTIONS.DRAGON_SIGHT.id]: STATUSES.RIGHT_EYE.id,
}

const BUFF_DURATION = 20000
const BUFF_GCD_TARGET = 8
const BUFF_GCD_WARNING = 7
const BUFF_GCD_ERROR = 0

export default class Buffs extends Module {
	static handle = 'buffs'
	static title = t('drg.buffs.title')`Lance Charge & Dragon Sight`
	static dependencies = [
		'checklist',
		'combatants',
		'invuln',
		'suggestions',
		'jumps',
	]

	_lastGcd = 0
	_badLifeSurges = 0
	_fifthGcd = false
	_soloDragonSight = false

	_buffWindows = {
		[STATUSES.LANCE_CHARGE.id]: {
			current: null,
			history: [],
		},
		[STATUSES.RIGHT_EYE.id]: {
			current: null,
			history: [],
		},
	}

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('cast', {by: 'player', abilityId: [ACTIONS.LANCE_CHARGE.id, ACTIONS.DRAGON_SIGHT.id]}, this._onBuffCast)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.RIGHT_EYE_SOLO.id}, () => this._soloDragonSight = true)
		this.addHook('complete', this._onComplete)
	}

	_pushToWindow(event, statusId, tracker) {
		if (this.combatants.selected.hasStatus(statusId)) {
			if (tracker.current === null) {
				// This can potentially happen if either LC or DS are used pre-pull
				tracker.current = {
					start: this.parser.fight.start_time,
					casts: [],
					isBad: false, // May want to flip this to true if prepull uses are actually a mistake
				}
			}

			tracker.current.casts.push(event)
		}
	}

	_onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (action && action.onGcd) {
			this._lastGcd = action.id
			if (BAD_LIFE_SURGE_CONSUMERS.includes(action.id)) {
				this._fifthGcd = false // Reset the 4-5 combo hit flag on other GCDs
				if (this.combatants.selected.hasStatus(STATUSES.LIFE_SURGE.id)) {
					this._badLifeSurges++
				}
			} else if (FINAL_COMBO_HITS.includes(action.id)) {
				if (!this._fifthGcd) {
					// If we get 2 of these in a row (4-5 combo hits), only the first one is considered bad, so set a flag to ignore the next one
					this._fifthGcd = true
					if (this.combatants.selected.hasStatus(STATUSES.LIFE_SURGE.id)) {
						this._badLifeSurges++
					}
				}
			}
		}

		this._pushToWindow(event, STATUSES.LANCE_CHARGE.id, this._buffWindows[STATUSES.LANCE_CHARGE.id])
		this._pushToWindow(event, STATUSES.RIGHT_EYE.id, this._buffWindows[STATUSES.RIGHT_EYE.id])
		this._pushToWindow(event, STATUSES.RIGHT_EYE_SOLO.id, this._buffWindows[STATUSES.RIGHT_EYE.id])
	}

	_onBuffCast(event) {
		const tracker = this._buffWindows[STATUS_MAP[event.ability.guid]]
		if (tracker.current !== null) {
			tracker.current.gcdCount = tracker.current.casts.filter(cast => {
				const action = getDataBy(ACTIONS, 'id', cast.ability.guid)
				return action && action.onGcd
			}).length
			tracker.history.push(tracker.current)
		}

		tracker.current = {
			start: event.timestamp,
			casts: [],
			isBad: BAD_BUFF_ACTIONS.includes(this._lastGcd),
			partial: false,
		}
	}

	_getDisembowelUptimePercent() {
		const statusUptime = this.combatants.getStatusUptime(STATUSES.DISEMBOWEL.id)
		const fightUptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()
		return (statusUptime / fightUptime) * 100
	}

	_closeLastWindow(statusId) {
		const tracker = this._buffWindows[statusId]

		// If there's no current cast just stop here
		if (!tracker.current) {
			return
		}

		// Partial windows should be included at the end of the fight,
		// as it is optimal to use the buff there even though you don't get
		// the full duration. They'll be marked in the table.
		if (this.combatants.selected.hasStatus(statusId)) {
			if (tracker.current) {
				tracker.current.partial = true
			}
		}

		tracker.current.gcdCount = tracker.current.casts.filter(cast => {
			const action = getDataBy(ACTIONS, 'id', cast.ability.guid)
			return action && action.onGcd
		}).length
		tracker.history.push(tracker.current)
	}

	// returns the number of casts of a buff you can get in the fight,
	// and also returns the amount of time that gets clipped by invulns if you do this.
	_computeMaxBuffs(start, end, cd, duration, windows) {
		let currentTime = start
		let count = 0
		let timeLost = 0

		while (currentTime < end) {
			count += 1
			const buffStart = currentTime
			const buffEnd = currentTime + duration
			currentTime += cd

			// check if that falls within a downtime window, if so, current time is now the
			// end of the window
			for (const window of windows) {
				if (window.start <= currentTime && currentTime <= window.end) {
					// inside window, set current to end
					currentTime = window.end
				}

				// also for buffs, check if we lost time to an invuln window
				// only possible case: invuln starts after buff starts,
				if (buffStart < window.start) {
					// buff ends in window
					if (window.start < buffEnd && buffEnd < window.end) {
						timeLost += buffEnd - window.start
					} else if (buffEnd >= window.end) {
						// buff does not end in window
						timeLost += window.end - window.start
					}
				}
			}
		}

		return {count, timeLost}
	}

	// returns the number of full duration buff casts you can get in a fight
	// and also returns the amount of time that gets clipped by the end of the fight if applicable
	_computeMaxFullBuffs(start, end, cd, duration, windows) {
		let currentTime = start
		let count = 0
		let timeLost = 0

		while (currentTime < end) {
			const buffStart = currentTime
			const buffEnd = currentTime + duration

			// for full duration buffs, see if a window starts after a
			// buff starts
			for (const window of windows) {
				// this time we skip if the duration runs into a window
				// this should find the furthest window just in case there's some weird stuff happening
				if (buffStart < window.start &&	((window.start < buffEnd && buffEnd < window.end) || buffEnd >= window.end)) {
					currentTime = window.end
				}
			}

			// check how much we lose from using it at the end
			if (buffEnd > end) {
				timeLost += buffEnd - end
			}

			count += 1
			currentTime += cd
		}

		return {count, timeLost}
	}

	_onComplete() {
		this._closeLastWindow(STATUSES.LANCE_CHARGE.id)
		this._closeLastWindow(STATUSES.RIGHT_EYE.id)
		this.checklist.add(new Rule({
			name: <Trans id="drg.buffs.checklist.name">Keep {ACTIONS.DISEMBOWEL.name} up</Trans>,
			description: <Trans id="drg.buffs.checklist.description">
				<ActionLink {...ACTIONS.DISEMBOWEL}/> provides a 10% boost to your personal damage and should always be kept up.
			</Trans>,
			displayOrder: DISPLAY_ORDER.DISEMBOWEL,
			requirements: [
				new Requirement({
					name: <Trans id="drg.buffs.checklist.requirement.name"><ActionLink {...ACTIONS.DISEMBOWEL}/> uptime</Trans>,
					percent: () => this._getDisembowelUptimePercent(),
				}),
			],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.LIFE_SURGE.icon,
			content: <Trans id="drg.buffs.suggestions.life-surge.content">
				Avoid using <ActionLink {...ACTIONS.LIFE_SURGE}/> on any GCD that isn't <ActionLink {...ACTIONS.FULL_THRUST}/> or a 5th combo hit. Any other combo action will have significantly less potency, losing a lot of the benefit of the guaranteed crit.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: this._badLifeSurges,
			why: <Trans id="drg.buffs.suggestions.life-surge.why">
				You used {ACTIONS.LIFE_SURGE.name} on a non-optimal GCD <Plural value={this._badLifeSurges} one="# time" other="# times"/>.
			</Trans>,
		}))

		const badLanceCharges = this._buffWindows[STATUSES.LANCE_CHARGE.id].history.filter(window => window.casts.length > 0 && window.isBad).length
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.LANCE_CHARGE.icon,
			content: <Trans id="drg.buffs.suggestions.bad-lcs.content">
				Avoid using <ActionLink {...ACTIONS.LANCE_CHARGE}/> immediately after <ActionLink {...ACTIONS.CHAOS_THRUST}/> or <ActionLink {...ACTIONS.FULL_THRUST}/> in order to get the most possible damage out of each window.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
			},
			value: badLanceCharges,
			why: <Trans id="drg.buffs.suggestions.bad-lcs.why">
				{badLanceCharges} of your Lance Charge windows started right after a standard combo finisher.
			</Trans>,
		}))

		// I'm not going to say how close I came to naming this variable badDragons
		const badDragonSights = this._buffWindows[STATUSES.RIGHT_EYE.id].history.filter(window => window.casts.length > 0 && window.isBad).length
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DRAGON_SIGHT.icon,
			content: <Trans id="drg.buffs.suggestions.bad-dss.content">
				Avoid using <ActionLink {...ACTIONS.DRAGON_SIGHT}/> immediately after <ActionLink {...ACTIONS.CHAOS_THRUST}/> or <ActionLink {...ACTIONS.FULL_THRUST}/> in order to get the most possible damage out of each window.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
			},
			value: badDragonSights,
			why: <Trans id="drg.buffs.suggestions.bad-dss.why">
				{badDragonSights} of your Dragon Sight windows started right after a standard combo finisher.
			</Trans>,
		}))

		if (this._soloDragonSight) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DRAGON_SIGHT.icon,
				content: <Trans id="drg.buffs.suggestions.solo-ds.content">
					Although it doesn't impact your personal DPS, try to always use Dragon Sight on a partner in group content so that someone else can benefit from the damage bonus too.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="drg.buffs.suggestions.solo-ds.why">
					At least 1 of your Dragon Sight casts didn't have a tether partner.
				</Trans>,
			}))
		}
	}

	_formatGcdCount(count) {
		if (count === BUFF_GCD_ERROR) {
			return <span className="text-error">{count}</span>
		}

		if (count <= BUFF_GCD_WARNING) {
			return <span className="text-warning">{count}</span>
		}

		return count
	}

	_getMaxBuffData() {
		const windows = this.invuln.getInvulns()
		const fightLength =	this.parser.fight.end_time - this.parser.fight.start_time

		for (const actionId in STATUS_MAP) {
			const action = getDataBy(ACTIONS, 'id', parseInt(actionId))
			const buffWindows = this._buffWindows[STATUS_MAP[actionId]]
			const first =	buffWindows.length > 0 ? buffWindows[0].start	: this.parser.fight.start_time

			buffWindows.maxCasts = this._computeMaxBuffs(first, this.parser.fight.end_time,	action.cooldown * 1000,	BUFF_DURATION, windows)
			buffWindows.maxFull = this._computeMaxFullBuffs(first, this.parser.fight.end_time, action.cooldown * 1000, BUFF_DURATION,	windows)
			buffWindows.maxDrift = fightLength - (buffWindows.maxFull.count - 1) * action.cooldown * 1000
		}
	}

	output() {
		this._getMaxBuffData()

		let totalLCDrift = 0
		let totalDSDrift = 0
		const lcRows = this._buffWindows[STATUSES.LANCE_CHARGE.id].history.map((window, idx) => {
			const history = this._buffWindows[STATUSES.LANCE_CHARGE.id].history
			const delay = idx > 0 ? window.start - history[idx - 1].start : 0
			const drift =	idx > 0 ? delay - ACTIONS.LANCE_CHARGE.cooldown * 1000 : 0
			totalLCDrift += drift

			return <Table.Row key={window.start}>
				<Table.Cell>
					{this.jumps.createTimelineButton(window.start)}
				</Table.Cell>
				<Table.Cell>{this.parser.formatDuration(delay)}</Table.Cell>
				<Table.Cell>{this.parser.formatDuration(drift)}</Table.Cell>
				<Table.Cell>
					{this._formatGcdCount(window.gcdCount)}
					{window.partial ? '*' : ''}
				</Table.Cell>
				<Table.Cell>
					<Rotation events={window.casts} />
				</Table.Cell>
			</Table.Row>
		})

		const dsRows = this._buffWindows[STATUSES.RIGHT_EYE.id].history.map((window, idx) => {
			const history = this._buffWindows[STATUSES.RIGHT_EYE.id].history
			const delay = idx > 0 ? window.start - history[idx - 1].start : 0
			const drift =
				idx > 0 ? delay - ACTIONS.DRAGON_SIGHT.cooldown * 1000 : 0
			totalDSDrift += drift

			return <Table.Row key={window.start}>
				<Table.Cell>
					{this.jumps.createTimelineButton(window.start)}
				</Table.Cell>
				<Table.Cell>{this.parser.formatDuration(delay)}</Table.Cell>
				<Table.Cell>{this.parser.formatDuration(drift)}</Table.Cell>
				<Table.Cell>
					{this._formatGcdCount(window.gcdCount)}
					{window.partial ? '*' : ''}
				</Table.Cell>
				<Table.Cell>
					<Rotation events={window.casts} />
				</Table.Cell>
			</Table.Row>
		})

		return <Fragment>
			<Message>
				<Trans id="drg.buffs.accordion.message">
					Each of your <ActionLink {...ACTIONS.LANCE_CHARGE} /> and{' '} <ActionLink {...ACTIONS.DRAGON_SIGHT} /> windows should ideally contain {BUFF_GCD_TARGET} GCDs at minimum. In an optimal situation,	you should be able to fit {BUFF_GCD_TARGET + 1}, but it may be difficult depending on ping and skill speed. These buffs should be used as frequently as possible at the proper spot in the GCD rotation, and will ideally not clip into boss invulnerability	windows. Each buff window below indicates how many GCDs it contained and what those GCDs were.
				</Trans>
			</Message>
			{lcRows.length > 0 && (
				<>
					<Header size="small">
						<Trans id="drg.buffs.accordion.lc-header">Lance Charge</Trans>
					</Header>
					<Message info>
						<Trans id="drg.buffs.accordion.lc-count"><Icon name={'info'} /> You used <ActionLink {...ACTIONS.LANCE_CHARGE} />	<strong>{this._buffWindows[STATUSES.LANCE_CHARGE.id].history.length}</strong> times. In this fight, you could fit <strong>{this._buffWindows[STATUSES.LANCE_CHARGE.id].maxFull.count}</strong> full buff windows.</Trans>
					</Message>
					<Table>
						<Table.Header>
							<Table.Row key="lc-header">
								<Table.HeaderCell><Trans id="drg.buffs.table.time">Time</Trans></Table.HeaderCell>
								<Table.HeaderCell><Trans id="drg.buffs.table.cd">CD</Trans></Table.HeaderCell>
								<Table.HeaderCell><Trans id="drg.buffs.table.drift">Drift</Trans></Table.HeaderCell>
								<Table.HeaderCell><Trans id="drg.buffs.table.gcds">GCDs</Trans></Table.HeaderCell>
								<Table.HeaderCell><Trans id="drg.buffs.table.casts">Casts</Trans></Table.HeaderCell>
							</Table.Row>
						</Table.Header>
						{lcRows}
					</Table>
					<Message info>
						<Icon name={'clock'} /> Your casts drifted by <strong>{this.parser.formatDuration(totalLCDrift)}</strong>. In	order to fit all full duration buffs, you needed a maximum drift	of <strong>{this.parser.formatDuration(this._buffWindows[STATUSES.LANCE_CHARGE.id].maxDrift)}</strong>.
					</Message>
				</>
			)}
			{dsRows.length > 0 && (
				<>
					<Header size="small">
						<Trans id="drg.buffs.accordion.ds-header">Dragon Sight</Trans>
					</Header>
					<Message info>
						<Trans id="drg.buffs.accordion.ds-count"><Icon name={'info'} /> You used <ActionLink {...ACTIONS.DRAGON_SIGHT} /> <strong>{this._buffWindows[STATUSES.RIGHT_EYE.id].history.length}</strong> times. In this fight, you could fit <strong>{this._buffWindows[STATUSES.RIGHT_EYE.id].maxFull.count}</strong>	full buff windows.</Trans>
					</Message>
					<Table>
						<Table.Header>
							<Table.Row key="ds-header">
								<Table.HeaderCell><Trans id="drg.buffs.table.time">Time</Trans></Table.HeaderCell>
								<Table.HeaderCell><Trans id="drg.buffs.table.cd">CD</Trans></Table.HeaderCell>
								<Table.HeaderCell><Trans id="drg.buffs.table.drift">Drift</Trans></Table.HeaderCell>
								<Table.HeaderCell><Trans id="drg.buffs.table.gcds">GCDs</Trans></Table.HeaderCell>
								<Table.HeaderCell><Trans id="drg.buffs.table.casts">Casts</Trans></Table.HeaderCell>
							</Table.Row>
						</Table.Header>
						{dsRows}
					</Table>
					<Message info>
						<Icon name={'clock'} /> Your casts drifted by	<strong>{this.parser.formatDuration(totalDSDrift)}</strong>. In	order to fit all full duration buffs, you needed a maximum drift	of <strong>{this.parser.formatDuration(this._buffWindows[STATUSES.RIGHT_EYE.id].maxDrift)}</strong>.
					</Message>
				</>
			)}
		</Fragment>
	}
}
