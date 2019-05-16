import {t} from '@lingui/macro'
// import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS, {getAction} from 'data/ACTIONS'
// import JOBS, {ROLES} from 'data/JOBS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent, HealEvent} from 'fflogs'
import Module from 'parser/core/Module'
import React from 'react'
import {Pie as PieChart} from 'react-chartjs-2'
import {Grid} from 'semantic-ui-react'
// import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
/*
- Healing pie charts of healing by source (ogcd/gcd/hot/shields),
and a pie chart of gcd usage, with a focus on healing
(damage is all under 1 category, while healing split up on a per skill basis)

*/
// import DISPLAY_ORDER from './DISPLAY_ORDER'
import {steelblue} from 'color-name'
import styles from './HealingBreakdown.module.css'

const NO_ACTION_ID: number = -1

const GCD_HEALS: number[] = [
	ACTIONS.BENEFIC.id,
	ACTIONS.BENEFIC_II.id,
	ACTIONS.HELIOS.id,
	ACTIONS.ASPECTED_HELIOS.id,
	ACTIONS.ASPECTED_BENEFIC.id,
	ACTIONS.ASCEND.id,
]

const OGCD_HEALS: number[] = [
	ACTIONS.ESSENTIAL_DIGNITY.id,
	ACTIONS.LADY_OF_CROWNS.id,
	ACTIONS.EARTHLY_STAR.id,
	ACTIONS.ASPECTED_BENEFIC.id,
]

const HOT_HEALS: number[] = [
	STATUSES.ASPECTED_HELIOS.id,
	STATUSES.WHEEL_OF_FORTUNE.id,
	STATUSES.ASPECTED_BENEFIC.id,
]

const GCD_DAMAGE: number[] = [
	ACTIONS.MALEFIC_III.id,
	ACTIONS.COMBUST_II.id,
	ACTIONS.GRAVITY.id,
]

const CHART_COLOURS: {[key: string]: string} = {
	[NO_ACTION_ID]: '#888',
	[ACTIONS.BENEFIC.id]: '#9c0',
	[ACTIONS.BENEFIC_II.id]: '#9c0',
	[ACTIONS.HELIOS.id]: '#218cd6',
	[ACTIONS.ASPECTED_HELIOS.id]: '#218cd6',
	[ACTIONS.ASPECTED_BENEFIC.id]: '#9c0',
	[ACTIONS.MALEFIC_III.id]: '#d60808',
	[ACTIONS.COMBUST_II.id]: '#d60808',
	[ACTIONS.GRAVITY.id]: '#d60808',
}

const HEAL_TYPE_COLORS: {[key: string]: string} = {
	['oGCD']: '#9c0',
	['HoT']: '#218cd6',
	['GCD']: '#d60808',
	['Mitigation']: 'steelblue',
	['Shield']: 'grey',
}

export default class HealingBreakdown extends Module {
	static handle = 'healingbreakdown'
	static title = t('ast.piecharts.title')`Pie Charts`

	static displayOrder = 49

	_gcdHistory = new Map()

	_healHistory = new Map([
		['oGCD', 0],
		['GCD', 0],
		['HoT', 0],
		['Shield', 0],
		['Mitigation', 0],
	])

	protected init() {

		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('heal', {by: 'player', abilityId: [...GCD_HEALS, ...OGCD_HEALS]}, this._onHeal)
		// this.addHook('applybuff', {by: 'player', abilityId: [STATUSES.NOCTURNAL_FIELD.id]}, this._onShield)
		// this.addHook('applybuff', {by: 'player', abilityId: [STATUSES.COLLECTIVE_UNCONSCIOUS_EFFECT.id]}, this._onMitigate)
		// this.addHook('complete', this._onComplete)
	}

	_onCast(event: CastEvent) {
		const cast: any = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (cast.onGcd) {
			this._logGcdEvent(event)
		}
	}

	/*  *
		* Healing by type
		* 1. ogcd
		* 2. gcd
		* 3. hot
		* 4. shield mitigation
		* 5. other mitigation
		* 6. target based
		*
	*/
	_onHeal(event: HealEvent) {

		// case 1
		if (OGCD_HEALS.includes(event.ability.guid)) {
			const currentAmount = this._healHistory.get('oGCD') || 0
			this._healHistory.set('oGCD', currentAmount + event.amount)
		}
		// case 2
		if (GCD_HEALS.includes(event.ability.guid)) {
			const currentAmount = this._healHistory.get('GCD') || 0
			this._healHistory.set('GCD', currentAmount + event.amount)
		}
		// case 3
		if (HOT_HEALS.includes(event.ability.guid)) {
			// if (event.tick && event.amount > 0 && HOT_HEALS.includes(event.ability.guid)) {
			const currentAmount = this._healHistory.get('HoT') || 0
			this._healHistory.set('HoT', currentAmount + event.amount)
		}

	}
	// _onShield(event: BuffEvent) {
	// 	console.log(event)
	// 	// case 4
	// 	// const currentAmount = this._healHistory.get('Shield') || 0
	// 	// this._healHistory.set('Shield', currentAmount + event.amount)
	// }

	// makes a Map of actionIds:uses
	_logGcdEvent(event: CastEvent) {
		const actionId = event.ability.guid

		if (!this._gcdHistory.has(actionId)) {
			this._gcdHistory.set(actionId, 0)
		}

		const count = this._gcdHistory.get(actionId)
		this._gcdHistory.set(actionId, count + 1)

	}

	_onMitigate() {
		//
	}
	_onComplete() {
		// Finalise the history
		// TODO: sort out dps moves seperately
		this._gcdHistory = new Map([...this._gcdHistory.entries()].sort((a, b) =>  b[1] - a[1]))
	}

	getPercentValues(key: any, mapObject: any) {
		const mapObjArray: number[] = Array.from(mapObject.values())

		const total = mapObjArray.reduce((sum, value) => sum + value)
		return Math.round((mapObject.get(key) / total) * 100)
	}

	output() {
		const gcdKeys = Array.from(this._gcdHistory.keys())
		// console.log(gcdKeys)
		// console.log(gcdKeys.map(actionId => getAction(actionId)))

		const gcdData = {
			labels: gcdKeys.map(actionId => {
				const action: any = getAction(actionId)
				return action.name || ''
			}),
			datasets: [{
				data: Array.from(this._gcdHistory.values()),
				backgroundColor: gcdKeys.map(actionId => CHART_COLOURS[actionId]),
			}],
		}

		const healKeys = Array.from(this._healHistory.keys())
		const healData = {
			labels: healKeys,
			datasets: [{
				data: Array.from(this._healHistory.values()),
				backgroundColor: healKeys.map(type => HEAL_TYPE_COLORS[type]),
			}],
		}

		const options = {
			responsive: false,
			legend: {display: false},
			tooltips: {enabled: false},
		}
		console.log(this._healHistory)
		console.log(healData)

		return <Grid columns="two">
			<Grid.Column>
				<div>GCD Breakdown</div>
				<div>
					<div className={styles.chartWrapper}>
						<PieChart
							data={gcdData}
							options={options}
							width={100}
							height={100}
						/>
					</div>
					<table className={styles.table}>
						<thead>
							<tr>
								<th></th>
								<th>Action</th>
								<th>Uses</th>
								{/* <th>%</th> */}
							</tr>
						</thead>
						<tbody>
							{gcdKeys.map(actionId => {
								const action: any = getAction(actionId)
								return <tr key={actionId}>
									<td><span
										className={styles.swatch}
										style={{backgroundColor: CHART_COLOURS[actionId]}}
									/></td>
									<td>{action.name}</td>
									<td>{this._gcdHistory.get(actionId)}</td>
									{/* <td>{this.getPercentValues(actionId, this._gcdHistory)}</td> */}
								</tr>
							})}
						</tbody>
					</table>
				</div>
			</Grid.Column>
			<Grid.Column>
				<div>Healing Breakdown</div>
				<div>
					<div className={styles.chartWrapper}>
						<PieChart
							data={healData}
							options={options}
							width={100}
							height={100}
						/>
					</div>
					<table className={styles.table}>
						<thead>
							<tr>
								<th></th>
								<th>Type of heal</th>
								<th>% of heals</th>
							</tr>
						</thead>
						<tbody>
							{healKeys.map(healType => <tr key={healType}>
								<td><span
									className={styles.swatch}
									style={{backgroundColor: HEAL_TYPE_COLORS[healType]}}
								/></td>
								<td>{healType}</td>
								<td>{this.getPercentValues(healType, this._healHistory)}</td>
							</tr>)}
						</tbody>
					</table>
				</div>
			</Grid.Column>

		</Grid>
	}
}
