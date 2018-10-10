import Color from 'color'
import React, {Fragment} from 'react'
import {Pie as PieChart} from 'react-chartjs-2'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES, {getStatus} from 'data/STATUSES'

import Module from 'parser/core/Module'
import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Shamelessly import Muscle Mage, you must cast Fist to continue
import styles from '../smn/Pets.module.css'

const STANCELESS = 0

const STANCES = [
	STATUSES.FISTS_OF_EARTH.id,
	STATUSES.FISTS_OF_FIRE.id,
	STATUSES.FISTS_OF_WIND.id,
]

const CHART_COLOURS = {
	[STANCELESS]: '#888',
	[STATUSES.FISTS_OF_EARTH.id]: Color(JOBS.MONK.colour),   // idk it matches
	[STATUSES.FISTS_OF_FIRE.id]: Color(JOBS.WARRIOR.colour), // POWER
	[STATUSES.FISTS_OF_WIND.id]: Color(JOBS.PALADIN.colour), // only good for utility
}

const STANCELESS_SEVERITY = {
	1: SEVERITY.MEDIUM,
	12: SEVERITY.MAJOR,
}

export default class Fists extends Module {
	static handle = 'fists'
	static dependencies = [
		'combatants',
		'suggestions',
	]

	static title = 'Fist Stances'

	_activeFist = STANCES.find(fist => this.combatants.selected.hasStatus(fist)) || STANCELESS
	_fistUptime = {[STANCELESS]: 0} // Initialise stanceless to prevent weird UI shit

	_lastFistChange = this.parser.fight.start_time

	constructor(...args) {
		super(...args)
		this.addHook('applybuff', {to: 'player', abilityId: STANCES}, this._onGain)
		this.addHook('removebuff', {to: 'player', abilityId: STANCES}, this._onRemove)
		this.addHook('complete', this._onComplete)
	}

	_onGain(event) {
		this.handleFistChange(event.ability.guid)
	}

	_onRemove() {
		// This is kinda flaky, there's a chance for remove to run after gain and effectively
		// set the entire active fist to be null. Open to ideas on making this more deterministic.
		// It seems to work fine in tests tho so YOLO.

		// Treat it as stanceless, switching Fist without dropping the old one has the same timestamp
		this.handleFistChange(0)
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FISTS_OF_FIRE.icon,
			content: <Fragment>
				Fist buffs are one of your biggest DPS contributors, either directly with <ActionLink {...ACTIONS.FISTS_OF_FIRE} /> or <StatusLink {...STATUSES.GREASED_LIGHTNING_I} /> manipulation with <ActionLink {...ACTIONS.FISTS_OF_EARTH} /> and <ActionLink {...ACTIONS.FISTS_OF_WIND} />.
			</Fragment>,
			why: `No Fist buff was active for ${this.parser.formatDuration(this._fistUptime[STANCELESS])}.`,
			tiers: STANCELESS_SEVERITY,
			value: this._fistUptime[STANCELESS],
		}))

		// Super lenient trigger, this assumes RoE on cooldown, we could probably work off Earth's Reply
		// but this is a pretty niche situation already, and the Fists chart should make it obvious enough.
		if (this._fistUptime[STATUSES.FISTS_OF_EARTH.id] > this.parser.fightDuration / 60 * 2) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FISTS_OF_EARTH.icon,
				content: <Fragment>
					When using <ActionLink {...ACTIONS.RIDDLE_OF_EARTH} />, remember to change back
					to <StatusLink {...STATUSES.FISTS_OF_FIRE} /> as soon as possible.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					<StatusLink {...STATUSES.FISTS_OF_EARTH} /> was active for
					{this.parser.formatDuration(this._fistUptime[STATUSES.FISTS_OF_EARTH.id])}.
					Did you forget to swap back to <StatusLink {...STATUSES.FISTS_OF_FIRE} />?
				</Fragment>,
			}))
		}
	}

	getStanceUptimePercent(stanceId) {
		const statusUptime = this.combatants.getStatusUptime(stanceId, this.parser.player.id)

		return ((statusUptime / this.parser.fightDuration) * 100).toFixed(2)
	}

	getStanceName(stanceId) {
		if (stanceId === STANCELESS) {
			return 'Stanceless'
		}

		// If this fucking errors...
		return getStatus(stanceId).name
	}

	handleFistChange(stanceId) {
		if (!this._fistUptime.hasOwnProperty(this._activeFist)) {
			this._fistUptime[this._activeFist] = 0
		}

		this._fistUptime[this._activeFist] += (this.parser.currentTimestamp - this._lastFistChange)
		this._lastFistChange = this.parser.currentTimestamp
		this._activeFist = stanceId
	}

	output() {
		const uptimeKeys = Object.keys(this._fistUptime).map(Number)

		const data = {
			labels: uptimeKeys.map(stanceId => this.getStanceName(stanceId)),
			datasets: [{
				data: Object.values(this._fistUptime),
				backgroundColor: uptimeKeys.map(stanceId => CHART_COLOURS[stanceId]),
			}],
		}

		const options = {
			responsive: false,
			legend: {display: false},
			tooltips: {enabled: false},
		}

		return <Fragment>
			<div className={styles.chartWrapper}>
				<PieChart
					data={data}
					options={options}
					height={100}
					width={200}
				/>
			</div>
			<table className={styles.table}>
				<thead>
					<tr>
						<th></th>
						<th>Stance</th>
						<th>Uptime</th>
						<th>%</th>
					</tr>
				</thead>
				<tbody>
					{uptimeKeys.map(stanceId => <tr key={stanceId}>
						<td><span
							className={styles.swatch}
							style={{backgroundColor: CHART_COLOURS[stanceId]}}
						/></td>
						<td>{this.getStanceName(stanceId)}</td>
						<td>{this.parser.formatDuration(this._fistUptime[stanceId])}</td>
						<td>{this.getStanceUptimePercent(stanceId)}%</td>
					</tr>)}
				</tbody>
			</table>
		</Fragment>
	}
}
