import React, {Component} from 'react'
import {Modal, Menu, Segment, Grid} from 'semantic-ui-react'
import styles from './Teatime.module.css'
import {Trans} from '@lingui/react'
import {JOB_COOLDOWNS} from './modules/PartyCooldowns'
import ACTIONS from 'data/ACTIONS'
import JOBS, {ROLES} from 'data/JOBS'
import {getDataBy} from 'data'
import PropTypes from 'prop-types'
import {ActionLink} from 'components/ui/DbLink'

// TODO: Break out ui components into better class structure
export default class TeaCooldownsSelector extends Component {
	tankcds = 'tankcooldowns'
	healcds = 'healercooldowns'
	dpscds = 'dpscooldowns'
	pleaseSelect = <Trans id="tea.cooldownselect.pleaseselect">Please select a category of cooldowns from above</Trans>

	// TODO: figure out a better way to determine column count
	maxGridColumns = 4 // eslint-disable-line no-magic-numbers

	state = {activeItem: this.tankcds}

	handleTabSwitch = (e, {name}) => {
		this.setState({activeItem: name})

		switch (name) {
		case this.tankcds:
			this.setState({activeContents: <div>{this.gridForRole(ROLES.TANK.id)}</div>})
			break
		case this.healcds:
			this.setState({activeContents: <div>{this.gridForRole(ROLES.HEALER.id)}</div>})
			break
		case this.dpscds:
			this.setState({activeContents: <div>{this.gridForRole([ROLES.MELEE.id, ROLES.PHYSICAL_RANGED.id, ROLES.MAGICAL_RANGED.id])}</div>})
			break
		default:
			this.setState({activeContents: this.pleaseSelect})
		}
	}

	roleIdForActorType(actorType) {
		const foundJob = JOBS[Object.keys(JOBS).find(job => JOBS[job].logType === actorType)]
		if (foundJob) {
			return foundJob.role
		}
		// undef is an acceptable fallback; it means the actor type refer to a playable class
	}

	gridForRole(roleId) {
		const jobsInRole =
			Object.keys(JOB_COOLDOWNS).filter(actorType => {
				if (typeof roleId === 'number') {
					return this.roleIdForActorType(actorType) === roleId
				}

				return roleId.includes(this.roleIdForActorType(actorType))
			})

		const cooldownIdsForRole = [...new Set(jobsInRole.flatMap(job => {
			return JOB_COOLDOWNS[job].actions
		}))]

		return this.gridForCooldowns(cooldownIdsForRole)
	}

	gridForCooldowns(cooldownIds) {
		if (!cooldownIds) {
			return <div>
				ERROR: No cooldowns found for the desired role. <br/>
				This probably means something was implemented wrong with respect to what the roles you can choose from are.
			</div>
		}

		const columns = cooldownIds.map((cooldownId) => {
			return <Grid.Column key={cooldownId}>
				<TeaCooldownTimeForm cooldownId={cooldownId}/>
			</Grid.Column>
		})

		return <Grid columns={this.maxGridColumns}>{columns}</Grid>
	}

	render() {
		const {activeItem, activeContents} = this.state
		if (activeItem && !activeContents) {
			this.handleTabSwitch(null, {name: activeItem})
		}

		const menu =
			<Menu attached="top">
				<Menu.Item
					name={this.tankcds}
					active={activeItem === this.tankcds}
					content={<Trans id="tea.cooldownselect.tanktab">Tank CDs</Trans>}
					onClick={this.handleTabSwitch}
				/>
				<Menu.Item
					name={this.healcds}
					active={activeItem === this.healcds}
					content={<Trans id="tea.cooldownselect.healtab">Healer CDs</Trans>}
					onClick={this.handleTabSwitch}
				/>
				<Menu.Item
					name={this.dpscds}
					active={activeItem === this.dpscds}
					content={<Trans id="tea.cooldownselect.dpstab">DPS CDs</Trans>}
					onClick={this.handleTabSwitch}
				/>
			</Menu>

		const modal =
			<Modal trigger={
				<span className={styles.cdselector}>
					<button>
						<Trans id="tea.cooldownselect.openbutton">Set your TEA cooldown plan</Trans>
					</button>
				</span>
			}>
				<Modal.Header>
					<Trans id="tea.cooldownselect.title">Cooldown selection</Trans>
				</Modal.Header>
				<Modal.Content>
					<p><b>Work in progress</b></p>

					{menu}

					<Segment attached="bottom">
						{activeContents ? activeContents : this.pleaseSelect}
					</Segment>
				</Modal.Content>
			</Modal>

		return modal
	}
}

// TODO: Break out into separate file
export class TeaCooldownTimeForm extends Component {
	static propTypes = {
		cooldownId: PropTypes.number,
	}

	constructor(props) {
		super(props)
		this.defaultTime = '00:00'
		this.state = {
			startTime: this.defaultTime,
			endTime: this.defaultTime,
			usages: [],
		}

		this.cooldown = getDataBy(ACTIONS, 'id', props.cooldownId)
		this.storageName = `tea-cooldown-timings-${this.cooldown.id}`

		this.startPlaceholder = 'Start time, e.g. 09:55'
		this.endPlaceholder = 'End time, e.g. 10:05'

		this.handleSubmitTiming = this.handleSubmitTiming.bind(this)
		this.handleChangedStart = this.handleChangedStart.bind(this)
		this.handleChangedEnd = this.handleChangedEnd.bind(this)
		this.deleteUsage = this.deleteUsage.bind(this)
		this.sortTimes = this.sortTimes.bind(this)
	}

	componentDidMount() {
		const loadedUsages = localStorage.getItem(this.storageName)
		if (loadedUsages) {
			this.setState({usages: JSON.parse(loadedUsages)})
		}
	}

	sortTimes(times) {
		return times.sort((a, b) => {
			const [aStartMin, aStartSec] = a.start.split(':')
			const [aEndMin, aEndSec] = a.end.split(':')
			const [bStartMin, bStartSec] = b.start.split(':')
			const [bEndMin, bEndSec] = b.end.split(':')

			if (aStartMin !== bStartMin) {
				return aStartMin - bStartMin
			}
			if (aStartSec !== bStartSec) {
				return aStartSec - bStartSec
			}
			if (aEndMin !== bEndMin) {
				return aEndMin - bEndMin
			}
			return aEndSec - bEndSec
		})
	}

	handleChangedStart(event) {
		this.setState({startTime: event.target.value})
	}

	handleChangedEnd(event) {
		this.setState({endTime: event.target.value})
	}

	handleSubmitTiming(event) {
		// Add the usage to the state and sort the list
		const newUsages = this.sortTimes(this.state.usages.concat({start: this.state.startTime, end: this.state.endTime}))
		this.setState({
			usages: newUsages,
		})

		// Update localStorage
		localStorage.setItem(this.storageName, JSON.stringify(newUsages))

		// Prevent the event from doing anything else like changing page or whatever
		event.preventDefault()
	}

	deleteUsage(event) {
		// Remove the usage from the state
		const newUsages = this.state.usages
		newUsages.splice(event.target.value, 1)
		this.setState({usages: newUsages})

		// Update localStorage
		localStorage.setItem(this.storageName, JSON.stringify(newUsages))
	}

	render() {
		const {usages} = this.state

		return <div>
			<ActionLink iconSize={styles.timingIconSize} {...this.cooldown}/>&nbsp;Timings

			<div>
				{(() => {
					if (usages.length > 0) {
						return <ul className={styles.cduselist}>
							{usages.map((usage, i) => {
								return <li key={i}>
									Between <b>{usage.start}</b> and <b>{usage.end}</b>
									<button type="button" onClick={this.deleteUsage} value={i}>X</button>
								</li>
							})}
						</ul>
					}
					return 'N/A'
				})()}
			</div>

			<form onSubmit={this.handleSubmitTiming}>
				<input
					type="text"
					required="required"
					aria-required="true"
					value={this.state.startTime}
					placeholder={this.startPlaceholder}
					onChange={this.handleChangedStart}
					pattern="\d\d:\d\d"
				/>
				<input
					type="text"
					required="required"
					aria-required="true"
					value={this.state.endTime}
					placeholder={this.endPlaceholder}
					onChange={this.handleChangedEnd}
					pattern="\d\d:\d\d"
				/>
				<input
					type="submit"
					value="Store Timing"
				/>
			</form>
		</div>
	}
}
