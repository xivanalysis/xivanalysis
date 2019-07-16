import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module, {DISPLAY_MODE} from 'parser/core/Module'
import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import Color from 'color'
import JOBS from 'data/JOBS'
import TimeLineChart from 'components/ui/TimeLineChart'

// Constants
const MAX_NINKI = 100

const NINKI_BUILDERS = {
	[ACTIONS.MUG.id]: 40,
	[ACTIONS.MEISUI.id]: 40,
	[ACTIONS.SPINNING_EDGE.id]: 8,
	[ACTIONS.GUST_SLASH.id]: 8,
	[ACTIONS.AEOLIAN_EDGE.id]: 8,
	[ACTIONS.SHADOW_FANG.id]: 8,
	[ACTIONS.ARMOR_CRUSH.id]: 8,
	[ACTIONS.DEATH_BLOSSOM.id]: 8, // TODO - Confirm whether AoE weaponskills count
	[ACTIONS.HAKKE_MUJINSATSU.id]: 8,
	[ACTIONS.THROWING_DAGGER.id]: 8,
}

const NINKI_SPENDERS = {
	[ACTIONS.HELLFROG_MEDIUM.id]: 80,
	[ACTIONS.BHAVACAKRA.id]: 80,
	[ACTIONS.BUNSHIN.id]: 80,
}

export default class Ninki extends Module {
	static handle = 'ninki'
	static title = t('nin.ninki.title')`Ninki Timeline`
	static displayMode = DISPLAY_MODE.FULL
	static dependencies = [
		'suggestions',
	]

	_ninki = 0
	_ninkiHistory = []
	_wasteBySource = {
		[ACTIONS.MUG.id]: 0,
		[ACTIONS.MEISUI.id]: 0,
		[ACTIONS.SPINNING_EDGE.id]: 0,
		[ACTIONS.GUST_SLASH.id]: 0,
		[ACTIONS.AEOLIAN_EDGE.id]: 0,
		[ACTIONS.SHADOW_FANG.id]: 0,
		[ACTIONS.ARMOR_CRUSH.id]: 0,
		[ACTIONS.DEATH_BLOSSOM.id]: 0, // TODO - Confirm whether AoE weaponskills count
		[ACTIONS.HAKKE_MUJINSATSU.id]: 0,
		[ACTIONS.THROWING_DAGGER.id]: 0,
	}
	_erroneousFrogs = 0 // This is my new band name

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: Object.keys(NINKI_BUILDERS).map(Number)}, this._onBuilderCast)
		this.addHook('cast', {by: 'player', abilityId: Object.keys(NINKI_SPENDERS).map(Number)}, this._onSpenderCast)
		this.addHook('aoedamage', {by: 'player', abilityId: ACTIONS.HELLFROG_MEDIUM.id}, this._onHellfrogAoe)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onBuilderCast(event) {
		const abilityId = event.ability.guid

		this._ninki += NINKI_BUILDERS[abilityId]
		if (this._ninki > MAX_NINKI) {
			const waste = this._ninki - MAX_NINKI
			this._wasteBySource[abilityId] += waste
			this._ninki = MAX_NINKI
		}

		this._pushToHistory()
	}

	_onSpenderCast(event) {
		this._ninki = Math.max(this._ninki - NINKI_SPENDERS[event.ability.guid], 0)
		this._pushToHistory()
	}

	_onHellfrogAoe(event) {
		if (event.hits.length === 1) {
			// If we have a Hellfrog AoE event with only one target, it should've been a Bhava instead
			this._erroneousFrogs++
		}
	}

	_onDeath() {
		// YOU DONE FUCKED UP NOW
		this._ninki = 0
		this._pushToHistory()
	}

	_pushToHistory() {
		const timestamp = this.parser.currentTimestamp - this.parser.fight.start_time
		this._ninkiHistory.push({t: timestamp, y: this._ninki})
	}

	_onComplete() {
		const totalWaste = Object.values(this._wasteBySource).reduce((reducer, value) => reducer + value)
		this.suggestions.add(new TieredSuggestion({
			icon: 'https://xivapi.com/i/005000/005411.png',
			content: <Trans id="nin.ninki.suggestions.waste.content">
				Avoid using <ActionLink {...ACTIONS.MUG}/> and <ActionLink {...ACTIONS.MEISUI}/> when above 50 Ninki and holding your Ninki spenders when near or at cap (with a few small exceptions) in order to maximize the number of spenders you can use over the course of a fight.
			</Trans>,
			tiers: {
				30: SEVERITY.MINOR,
				80: SEVERITY.MAJOR,
			},
			value: totalWaste,
			why: <Trans id="nin.ninki.suggestions.waste.why">
				Overcapping caused you to lose {totalWaste} Ninki over the fight.
			</Trans>,
		}))

		if (this._erroneousFrogs > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HELLFROG_MEDIUM.icon,
				content: <Trans id="nin.ninki.suggestions.frog.content">
					Avoid using <ActionLink {...ACTIONS.HELLFROG_MEDIUM}/> when you only have one target, as <ActionLink {...ACTIONS.BHAVACAKRA}/> has higher potency and can be used freely.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.ninki.suggestions.frog.why">
					You used Hellfrog Medium <Plural value={this._erroneousFrogs} one="# time" other="# times"/> when other spenders were available.
				</Trans>,
			}))
		}
	}

	output() {
		const ninkiColor = Color(JOBS.NINJA.colour)

		/* eslint-disable no-magic-numbers */
		const chartdata = {
			datasets: [
				{
					label: 'Ninki',
					steppedLine: true,
					data: this._ninkiHistory,
					backgroundColor: ninkiColor.fade(0.8),
					borderColor: ninkiColor.fade(0.5),
				},
			],
		}
		/* eslint-enable no-magic-numbers */

		return <Fragment>
			<TimeLineChart data={chartdata} />
		</Fragment>
	}
}
