import _ from 'lodash'
import React, {Component} from 'react'
import {Modal, Menu, Input, Image, Segment, Grid} from 'semantic-ui-react'
import styles from './Teatime.module.css'
import {Trans} from '@lingui/react'
import {JOB_COOLDOWNS} from './modules/PartyCooldowns'
import ACTIONS from 'data/ACTIONS'
import JOBS, {ROLES} from 'data/JOBS'
import {getDataBy} from 'data'

// TODO: Add the ability to select cooldowns
// TODO: Add a time input for the selected cooldown
// TODO: Add a way to save stuff
// TODO: Break out ui components into better class structure
export default class TeaCooldownsSelector extends Component {
	static propTypes = {}

	tankcds = 'tankcooldowns'
	healcds = 'healercooldowns'
	dpscds = 'dpscooldowns'
	pleaseSelect = <Trans id="tea.cooldownselect.pleaseselect">Please select a category of cooldowns from above</Trans>

	// TODO: figure out a better way to determine column count
	maxGridColumns = 16 // eslint-disable-line no-magic-numbers

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

	iconForCooldown(cooldownId) {
		return getDataBy(ACTIONS, 'id', cooldownId).icon
	}

	gridForRole(roleId) {
		const jobsInRole =
			Object.keys(JOB_COOLDOWNS).filter(actorType => {
				if (typeof roleId === 'number') {
					return this.roleIdForActorType(actorType) === roleId
				}

				return roleId.includes(this.roleIdForActorType(actorType))
			})

		const cooldownsForRole = [...new Set(jobsInRole.flatMap(job => {
			return JOB_COOLDOWNS[job].actions
		}))]

		return this.gridForCooldowns(cooldownsForRole)
	}

	gridForCooldowns(cooldowns) {
		if (!cooldowns) {
			return <div>
				ERROR: No cooldowns found for the desired role. <br/>
				This probably means something was implemented wrong with respect to what the roles you can choose from are.
			</div>
		}

		if (cooldowns.length <= this.maxGridColumns) {
			const columns = _.times(cooldowns.length, (i) => {
				return <Grid.Column key={i}>
					<Image src={this.iconForCooldown(cooldowns[i])}/>
				</Grid.Column>
			})
			return <Grid>{columns}</Grid>
		}

		const rowsCount = Math.ceil(cooldowns.length / this.maxGridColumns)
		const rows = _.times(rowsCount, (i) => {
			const startIndex = i * this.maxGridColumns
			let endIndex = startIndex + this.maxGridColumns
			if (endIndex >= cooldowns.length) {
				endIndex = cooldowns.length - 1
			}
			const columnsCount = endIndex - startIndex
			const columns = _.times(columnsCount, (j) => {
				return <Grid.Column key={j}>
					<Image src={this.iconForCooldown(cooldowns[startIndex + j])}/>
				</Grid.Column>
			})

			return <Grid.Row key={i}>
				{columns}
			</Grid.Row>
		})

		return <Grid>{rows}</Grid>
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
				<Menu.Menu position="right">
					<Menu.Item>
						<Trans id="tea.cooldownselect.searchplaceholder" render={({translation}) => (
							<Input
								transparent
								icon={{name: 'search', link: true}}
								placeholder={translation}
							/>
						)}>
							Search cooldowns
						</Trans>
					</Menu.Item>
				</Menu.Menu>
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
