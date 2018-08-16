import {Trans, i18nMark} from '@lingui/react'
import React, {Fragment} from 'react'
import {Pie as PieChart} from 'react-chartjs-2'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import PETS from 'data/PETS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import styles from '../smn/Pets.module.css'

const NO_TURRET_ID = -1
const TURRET_RESET_ID = -2

const FIRST_TURRET_AUTO_THRESHOLD = 3000

const TURRET_SUMMON_ACTIONS = {
	[ACTIONS.ROOK_AUTOTURRET.id]: PETS.ROOK_AUTOTURRET.id,
	[ACTIONS.BISHOP_AUTOTURRET.id]: PETS.BISHOP_AUTOTURRET.id,
}

const TURRET_AUTO_ATTACKS = [
	ACTIONS.VOLLEY_FIRE.id,
	ACTIONS.CHARGED_VOLLEY_FIRE.id,
	ACTIONS.AETHER_MORTAR.id,
	ACTIONS.CHARGED_AETHER_MORTAR.id,
]

const CHART_COLORS = {
	[NO_TURRET_ID]: '#888',
	[TURRET_RESET_ID]: '#ccc',
	[PETS.ROOK_AUTOTURRET.id]: '#47adb6',
	[PETS.BISHOP_AUTOTURRET.id]: '#c65519',
}

export default class Turrets extends Module {
	static handle = 'turrets'
	static i18n_id = i18nMark('mch.turrets.title')
	static dependencies = [
		'suggestions',
	]

	_lastTurretSummon = this.parser.fight.start_time
	_activeTurret = PETS.ROOK_AUTOTURRET.id // Null assumption
	_turretUptime = {}
	_firstTurretAuto = true

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'pet', abilityId: TURRET_AUTO_ATTACKS}, this._onTurretAuto)
		this.addHook('cast', {by: 'player', abilityId: Object.keys(TURRET_SUMMON_ACTIONS).map(Number)}, this._onTurretSummoned)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.TURRET_RESET.id}, this._onApplyReset)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.TURRET_RESET.id}, this._onRemoveReset)
		this.addHook('death', {to: 'pet'}, this._onTurretDeath)
		this.addHook('complete', this._onComplete)
	}

	_onTurretAuto(event) {
		if (this._firstTurretAuto) {
			if (event.timestamp - this.parser.fight.start_time < FIRST_TURRET_AUTO_THRESHOLD) {
				// The first turret auto was within the first 3 seconds of the fight; we good
				if (event.ability.guid === ACTIONS.AETHER_MORTAR.id) {
					// ...But it was from a Bishop turret, so flip the null assumption accordingly
					this._activeTurret = PETS.BISHOP_AUTOTURRET.id
				}
			} else {
				// If it's outside the threshold, they started with no turret, so add downtime for the initial chunk of the fight up to the first summon
				const misassignedTime = this._lastTurretSummon - this.parser.fight.start_time
				this._turretUptime[PETS.ROOK_AUTOTURRET.id] -= misassignedTime // Null assumption is Rook, so this should be populated after the first summon
				this._turretUptime[NO_TURRET_ID] = misassignedTime // And this should be unpopulated until now, so we won't be clobbering any data
			}
		}

		this._firstTurretAuto = false
	}

	_handleTurretChange(turretId) {
		if (!this._turretUptime.hasOwnProperty(this._activeTurret)) {
			this._turretUptime[this._activeTurret] = 0
		}

		this._turretUptime[this._activeTurret] += (this.parser.currentTimestamp - this._lastTurretSummon)
		this._lastTurretSummon = this.parser.currentTimestamp
		this._activeTurret = turretId
	}

	_onTurretSummoned(event) {
		this._handleTurretChange(TURRET_SUMMON_ACTIONS[event.ability.guid])
	}

	_onApplyReset() {
		this._handleTurretChange(TURRET_RESET_ID)
	}

	_onRemoveReset() {
		this._handleTurretChange(NO_TURRET_ID)
	}

	_onTurretDeath() {
		if (this._activeTurret !== TURRET_RESET_ID) {
			// This poor turret died a natural death :(
			this._handleTurretChange(NO_TURRET_ID)
		}
	}

	_getTurretUptimePercent(turretId) {
		const percent = this._turretUptime[turretId] / this.parser.fightDuration
		return (percent * 100).toFixed(2)
	}

	_onComplete() {
		this._handleTurretChange(NO_TURRET_ID)
		const turretDowntime = this._getTurretUptimePercent(NO_TURRET_ID)
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.ROOK_AUTOTURRET.icon,
			content: <Fragment>
				<Trans id="mch.turrets.suggestions.no-turret.content">Turrets provide a significant portion of a MCH's passive damage and are required to use <ActionLink {...ACTIONS.HYPERCHARGE}/>. Make sure you resummon your turret immediately after <StatusLink {...STATUSES.TURRET_RESET}/> wears off or if it dies to AoEs.</Trans>
			</Fragment>,
			tiers: {
				2: SEVERITY.MINOR,
				4: SEVERITY.MEDIUM,
				6: SEVERITY.MAJOR,
			},
			value: turretDowntime,
			why: <Fragment>
				<Trans id="mch.turrets.suggestions.no-turret.why">No turret was active for {turretDowntime}% of the fight.</Trans>
			</Fragment>,
		}))
	}

	_getTurretName(turretId) {
		if (turretId === NO_TURRET_ID) {
			return 'No turret'
		}

		if (turretId === TURRET_RESET_ID) {
			return 'Turret reset'
		}

		return PETS[turretId].name
	}

	output() {
		const uptimeKeys = Object.keys(this._turretUptime).map(Number)

		const data = {
			labels: uptimeKeys.map(turretId => this._getTurretName(turretId)),
			datasets: [{
				data: Object.values(this._turretUptime),
				backgroundColor: uptimeKeys.map(turretId => CHART_COLORS[turretId]),
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
					width={100}
					height={100}
				/>
			</div>
			<table className={styles.table}>
				<thead>
					<tr>
						<th></th>
						<th>Turret</th>
						<th>Uptime</th>
						<th>%</th>
					</tr>
				</thead>
				<tbody>
					{uptimeKeys.map(turretId => <tr key={turretId}>
						<td><span
							className={styles.swatch}
							style={{backgroundColor: CHART_COLORS[turretId]}}
						/></td>
						<td>{this._getTurretName(turretId)}</td>
						<td>{this.parser.formatDuration(this._turretUptime[turretId])}</td>
						<td>{this._getTurretUptimePercent(turretId)}%</td>
					</tr>)}
				</tbody>
			</table>
		</Fragment>
	}
}
