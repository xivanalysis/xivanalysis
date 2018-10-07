import {Trans, Plural, i18nMark} from '@lingui/react'
import React from 'react'
import {Table} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

// Statuses that need to be up for Fester & Bane to actually do something good
const SMN_DOT_STATUSES = [
	STATUSES.BIO_III.id,
	STATUSES.MIASMA_III.id,
]

// Flow needs to be burnt before first use - 15s is optimal for first cast
const FIRST_FLOW_TIMESTAMP = 15000

const FESTER_POT_PER_DOT = 150

// Severities
// In potency
const FESTER_SEVERITY = {
	1: SEVERITY.MEDIUM,
	600: SEVERITY.MAJOR,
}

const PAINFLARE_SEVERITY = {
	1: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export default class Aetherflow extends Module {
	static handle = 'aetherflow'
	static i18n_id = i18nMark('smn.aetherflow.title')
	static dependencies = [
		// Ensure AoE runs cleanup before us
		'aoe', // eslint-disable-line xivanalysis/no-unused-dependencies
		'checklist',
		'cooldowns',
		'enemies',
		'gauge',
		'suggestions',
	]
	static displayOrder = DISPLAY_ORDER.AETHERFLOW

	// _badBanes = []         // In case we ever want to check for Banes where 1 or 0 DoTs are spread
	// _reallyBadBanes = []   // DoTless Bane...
	// _badFesters = []       // 1 DoT Fester. Oh no, it gets worse!
	// _reallyBadFesters = [] // 0 DoT Fester. :r333333:
	_badPainflares = []

	_badDotReqCasts = {}

	constructor(...args) {
		super(...args)

		this.addHook('cast', {
			by: 'player',
			abilityId: [ACTIONS.FESTER.id, ACTIONS.BANE.id],
		}, this._onDotReqCast)

		this.addHook('aoedamage', {
			by: 'player',
			abilityId: ACTIONS.PAINFLARE.id,
		}, this._onPainflareDamage)
		this.addHook('complete', this._onComplete)
	}

	_onDotReqCast(event) {
		const actionId = event.ability.guid

		const target = this.enemies.getEntity(event.targetID)
		if (!target) { return }
		const statusesMissing = SMN_DOT_STATUSES.length - SMN_DOT_STATUSES.filter(statusId => target.hasStatus(statusId)).length

		// Don't need to worry if they got them all up
		if (statusesMissing === 0) { return }

		// Make sure we're tracking this skill/num
		if (!this._badDotReqCasts[actionId]) {
			this._badDotReqCasts[actionId] = {}
		}
		if (!this._badDotReqCasts[actionId][statusesMissing]) {
			this._badDotReqCasts[actionId][statusesMissing] = 0
		}

		// Add to the appropriate key
		// Just tracking flat count for now. Expand to events if need info (for the timeline, yes pls)
		this._badDotReqCasts[actionId][statusesMissing]++
	}

	_onPainflareDamage(event) {
		// Only fault single target PFs _outside_ rushes.
		if (event.hits.length <= 1 && !this.gauge.isRushing()) {
			this._badPainflares.push(event)
		}
	}

	_onComplete() {
		// Checklist rule for aetherflow cooldown
		this.checklist.add(new Rule({
			name: <Trans id="smn.aetherflow.checklist.name">
				Use <ActionLink {...ACTIONS.AETHERFLOW} /> effectively
			</Trans>,
			description: <Trans id="smn.aetherflow.checklist.description">
				SMN's entire kit revolves around the Aetherflow cooldown. Make sure you squeeze every possible use out of it that you can.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="smn.aetherflow.checklist.requirement.aetherflow.name">
						<ActionLink {...ACTIONS.AETHERFLOW} /> cooldown uptime
					</Trans>,
					percent: (this.cooldowns.getTimeOnCooldown(ACTIONS.AETHERFLOW.id) / (this.parser.fightDuration - FIRST_FLOW_TIMESTAMP)) * 100,
				}),
			],
		}))

		// Suggestion for fester
		const badFesters = this._badDotReqCasts[ACTIONS.FESTER.id] || {}
		const festerKeys = Object.keys(badFesters).map(num => parseInt(num, 10))
		// Feel this can be used as a better base metric for judging Fester whiff severity, imo < 600 is medium, > major
		const totalFesterPotencyLost = festerKeys.reduce((carry, num) => carry + num * FESTER_POT_PER_DOT * badFesters[num], 0)

		// Sorry Nem, I've simplified this a lot to smooth out the i18n process. We can have a look into improving the output later.
		const numBadFesters = festerKeys.reduce((carry, num) => carry + badFesters[num], 0)

		// Fester suggestion
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FESTER.icon,
			content: <Trans id="smn.aetherflow.suggestions.fester.content">
				To get the most potency out of your <ActionLink {...ACTIONS.FESTER}/>s, ensure both <StatusLink {...STATUSES.BIO_III}/> and <StatusLink {...STATUSES.MIASMA_III}/> are applied to your target. Avoid casting Fester directly after DoT application, as the status takes a short period to apply.
			</Trans>,
			why: <Trans id="smn.aetherflow.suggestions.fester.why">
				{totalFesterPotencyLost} potency lost to
				<Plural value={numBadFesters} one="# cast" other="# casts"/>
				of Fester on targets missing DoTs.
			</Trans>,
			tiers: FESTER_SEVERITY,
			value: totalFesterPotencyLost,
		}))

		// Painflare suggestion, I want to say < 4 is medium because 4 is greater than a Deathflare
		const numBadPainflares = this._badPainflares.length
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.PAINFLARE.icon,
			content: <Trans id="smn.aetherflow.suggestions.painflare.content">
				Avoid casting <ActionLink {...ACTIONS.PAINFLARE}/> on a single target unless rushing a <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/>, as it deals less damage than <ActionLink {...ACTIONS.FESTER}/> per hit.
			</Trans>,
			why: <Trans id="smn.aetherflow.suggestions.painflare.why">
				{numBadPainflares} single-target
				<Plural value={numBadPainflares} one="cast" other="casts"/>
				of Painflare.
			</Trans>,
			tiers: PAINFLARE_SEVERITY,
			value: numBadPainflares,
		}))
	}

	// Suggestion section for Bane for later. Tricky to deal with, but there's bane seeds for spreads
	// However one good one to evaluate is single target banes (with the above included?)

	output() {
		// Really not happy with this output, but nem wanted it. (Nem: I appreciate a ton for now, we'll work it out)
		// Look into a better display somehow, hopefully integrate into timeline in some fashion.
		const casts = this.cooldowns.getCooldown(ACTIONS.AETHERFLOW.id).history
		let totalDrift = 0
		return <Table collapsing unstackable>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="smn.aetherflow.cast-time">Cast Time</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="smn.aetherflow.drift">Drift</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="smn.aetherflow.total-drift">Total Drift</Trans></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{casts.map((cast, i) => {
					let drift = null
					if (i > 0) {
						const prevCast = casts[i - 1]
						drift = cast.timestamp - (prevCast.timestamp + prevCast.length)
						if (process.env.NODE_ENV === 'production') {
							drift = Math.max(drift, 0)
						}
					}
					totalDrift += drift
					return <Table.Row key={cast.timestamp}>
						<Table.Cell>{this.parser.formatTimestamp(cast.timestamp)}</Table.Cell>
						<Table.Cell>{drift !== null ? this.parser.formatDuration(drift) : '-'}</Table.Cell>
						<Table.Cell>{totalDrift ? this.parser.formatDuration(totalDrift) : '-'}</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>
	}
}
