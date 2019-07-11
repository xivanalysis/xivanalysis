import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'
import {Accordion, Header, Message} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BAD_LIFE_SURGE_CONSUMERS = [
	ACTIONS.TRUE_THRUST.id,
	ACTIONS.VORPAL_THRUST.id,
	ACTIONS.DISEMBOWEL.id,
	ACTIONS.CHAOS_THRUST.id,
	ACTIONS.PIERCING_TALON.id,
	ACTIONS.DOOM_SPIKE.id,
	ACTIONS.SONIC_THRUST.id,
]
const FINAL_COMBO_HITS = [
	ACTIONS.FANG_AND_CLAW.id,
	ACTIONS.WHEELING_THRUST.id,
]
const LC_FIRST_ACTIONS = [
	ACTIONS.DISEMBOWEL.id,
	ACTIONS.CHAOS_THRUST.id,
	ACTIONS.FULL_THRUST.id,
]
const STATUS_MAP = {
	[ACTIONS.LANCE_CHARGE.id]: STATUSES.LANCE_CHARGE.id,
	[ACTIONS.DRAGON_SIGHT.id]: STATUSES.RIGHT_EYE.id,
}

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
	]

	_badLifeSurges = 0
	_fifthGcd = false

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
		this.addHook('complete', this._onComplete)
	}

	_pushToWindow(event, statusId) {
		const tracker = this._buffWindows[statusId]
		if (this.combatants.selected.hasStatus(statusId)) {
			const action = getDataBy(ACTIONS, 'id', event.ability.guid) || {}
			if (tracker.current === null) {
				// This can potentially happen if either B4B or DS are used pre-pull
				tracker.current = {
					start: this.parser.fight.start_time,
					casts: [],
					firstGcd: -1,
				}
			}

			tracker.current.casts.push(event)
			if (tracker.current.firstGcd === -1 && action.onGcd) {
				tracker.current.firstGcd = action.id
			}
		}
	}

	_onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (action && action.onGcd) {
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

		this._pushToWindow(event, STATUSES.LANCE_CHARGE.id)
		this._pushToWindow(event, STATUSES.RIGHT_EYE.id)
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
			firstGcd: -1,
		}
	}

	_getDisembowelUptimePercent() {
		const statusUptime = this.combatants.getStatusUptime(STATUSES.DISEMBOWEL.id)
		const fightUptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()
		return (statusUptime / fightUptime) * 100
	}

	_closeLastWindow(statusId) {
		// So we don't include partial windows
		if (this.combatants.selected.hasStatus(statusId)) {
			return
		}

		const tracker = this._buffWindows[statusId]

		// If there's no current cast just stop here
		if (!tracker.current) {
			return
		}

		tracker.current.gcdCount = tracker.current.casts.filter(cast => {
			const action = getDataBy(ACTIONS, 'id', cast.ability.guid)
			return action && action.onGcd
		}).length
		tracker.history.push(tracker.current)
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

		const badlyTimedLcs = this._buffWindows[STATUSES.LANCE_CHARGE.id].history.filter(window => window.casts.length > 0 && !LC_FIRST_ACTIONS.includes(window.firstGcd)).length
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.LANCE_CHARGE.icon,
			content: <Trans id="drg.buffs.suggestions.bad-lcs.content">
				Avoid using <ActionLink {...ACTIONS.LANCE_CHARGE}/> immediately before any GCD other than <ActionLink {...ACTIONS.DISEMBOWEL}/>, <ActionLink {...ACTIONS.CHAOS_THRUST}/>, and <ActionLink {...ACTIONS.FULL_THRUST}/> in order to get the most possible damage out of each window.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
			},
			value: badlyTimedLcs,
			why: <Trans id="drg.buffs.suggestions.bad-lcs.why">
				{badlyTimedLcs} of your Lance Charge windows started on a non-optimal GCD.
			</Trans>,
		}))
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

	output() {
		const lcPanels = this._buffWindows[STATUSES.LANCE_CHARGE.id].history.map(window => {
			return {
				title: {
					key: 'title-' + window.start,
					content: <Fragment>
						{this.parser.formatTimestamp(window.start)}
						<span> - </span>
						<Trans id="drg.buffs.panel-count">
							{this._formatGcdCount(window.gcdCount)} <Plural value={window.gcdCount} one="GCD" other="GCDs"/>
						</Trans>
					</Fragment>,
				},
				content: {
					key: 'content-' + window.start,
					content: <Rotation events={window.casts}/>,
				},
			}
		})
		const dsPanels = this._buffWindows[STATUSES.RIGHT_EYE.id].history.map(window => {
			return {
				title: {
					key: 'title-' + window.start,
					content: <Fragment>
						{this.parser.formatTimestamp(window.start)}
						<span> - </span>
						<Trans id="drg.buffs.panel-count">
							{this._formatGcdCount(window.gcdCount)} <Plural value={window.gcdCount} one="GCD" other="GCDs"/>
						</Trans>
					</Fragment>,
				},
				content: {
					key: 'content-' + window.start,
					content: <Rotation events={window.casts}/>,
				},
			}
		})

		return <Fragment>
			<Message>
				<Trans id="drg.buffs.accordion.message">Each of your <ActionLink {...ACTIONS.LANCE_CHARGE}/> and <ActionLink {...ACTIONS.DRAGON_SIGHT}/> windows should ideally contain {BUFF_GCD_TARGET} GCDs at minimum. In an optimal situation, you should be able to fit {BUFF_GCD_TARGET + 1}, but depending on ping and skill speed, it may require the aid of party speed buffs like <StatusLink {...STATUSES.FEY_WIND}/>. Each buff window below indicates how many GCDs it contained and will display all the casts in the window if expanded.</Trans>
			</Message>
			{lcPanels.length > 0 && <>
				<Header size="small">
					<Trans id="drg.buffs.accordion.lc-header">Lance Charge</Trans>
				</Header>
				<Accordion
					exclusive={false}
					panels={lcPanels}
					styled
					fluid
				/>
			</>}
			{dsPanels.length > 0 && <>
				<Header size="small">
					<Trans id="drg.buffs.accordion.ds-header">Dragon Sight</Trans>
				</Header>
				<Accordion
					exclusive={false}
					panels={dsPanels}
					styled
					fluid
				/>
			</>}
		</Fragment>
	}
}
