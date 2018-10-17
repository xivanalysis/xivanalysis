import {Trans, i18nMark} from '@lingui/react'
import React, {Fragment} from 'react'
import {Pie as PieChart} from 'react-chartjs-2'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import PETS from 'data/PETS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// TOOOAAAAASSST
// TODO: Generalise pie chart handling
import styles from 'components/ui/PieChartWithLegend.module.css'

const NO_TURRET_ID = -1
const TURRET_RESET_ID = -2

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
	_turretHasFired = false

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'pet', abilityId: TURRET_AUTO_ATTACKS}, this._onTurretAuto)
		this.addHook('cast', {by: 'player', abilityId: Object.keys(TURRET_SUMMON_ACTIONS).map(Number)}, this._onTurretSummoned)
		this.addHook('cast', {by: 'player', abilityId: [ACTIONS.ROOK_OVERDRIVE.id, ACTIONS.BISHOP_OVERDRIVE.id]}, this._onOverdriveCast)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.TURRET_RESET.id}, this._onApplyReset)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.TURRET_RESET.id}, this._onRemoveReset)
		this.addHook('death', {to: 'pet'}, this._onTurretDeath)
		this.addHook('complete', this._onComplete)
	}

	_onTurretAuto(event) {
		if (!this._turretHasFired) {
			// This is the first turret event, so we started with a turret out
			if (event.ability.guid === ACTIONS.AETHER_MORTAR.id || event.ability.guid === ACTIONS.CHARGED_AETHER_MORTAR.id) {
				// ...But the attack came from a Bishop turret, so flip the null assumption accordingly
				this._activeTurret = PETS.BISHOP_AUTOTURRET.id
			}

			this._turretHasFired = true
		}
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
		if (!this._turretHasFired) {
			// No turrets have actually fired yet, so correct the null assumption and clear the flag since we're in concrete data land now
			this._activeTurret = NO_TURRET_ID
			this._turretHasFired = true
		}

		this._handleTurretChange(TURRET_SUMMON_ACTIONS[event.ability.guid])
	}

	_onOverdriveCast(event) {
		if (!this._turretHasFired) {
			// If Overdrive is the first recorded turret shot, handle it the same way we handle autos (highly unlikely but better safe)
			if (event.ability.guid === ACTIONS.BISHOP_OVERDRIVE.id) {
				// Fix the assumption if it was a Bishop Overdrive, otherwise it's already correct
				this._activeTurret = PETS.BISHOP_AUTOTURRET.id
			}

			this._turretHasFired = true
		}
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
			content: <Trans id="mch.turrets.suggestions.no-turret.content">
				Turrets provide a significant portion of a MCH's passive damage and are required to use <ActionLink {...ACTIONS.HYPERCHARGE}/>. Make sure you resummon your turret immediately after <StatusLink {...STATUSES.TURRET_RESET}/> wears off or if it dies to AoEs.
			</Trans>,
			tiers: {
				2: SEVERITY.MINOR,
				4: SEVERITY.MEDIUM,
				6: SEVERITY.MAJOR,
			},
			value: turretDowntime,
			why: <Trans id="mch.turrets.suggestions.no-turret.why">
				No turret was active for {turretDowntime}% of the fight.
			</Trans>,
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
