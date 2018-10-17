import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {Link} from 'react-router-dom'
import {Header, Menu, Message, Segment, Icon} from 'semantic-ui-react'
import {Trans} from '@lingui/react'

import JobIcon from 'components/ui/JobIcon'
import JOBS, {ROLES} from 'data/JOBS'
import {patchSupported} from 'data/PATCHES'
import * as Errors from 'errors'
import AVAILABLE_MODULES from 'parser/AVAILABLE_MODULES'
import store from 'store'
import {setGlobalError} from 'store/actions'

import styles from './CombatantList.module.css'

class CombatantList extends Component {
	static propTypes = {
		report: PropTypes.shape({
			code: PropTypes.string.isRequired,
			start: PropTypes.number.isRequired,
			friendlies: PropTypes.arrayOf(PropTypes.shape({
				id: PropTypes.number.isRequired,
				name: PropTypes.string.isRequired,
				type: PropTypes.string.isRequired,
				fights: PropTypes.arrayOf(PropTypes.shape({
					id: PropTypes.number.isRequired,
				})).isRequired,
			})).isRequired,
		}).isRequired,
		currentFight: PropTypes.number.isRequired,
	}

	render() {
		const {friendlies, start} = this.props.report
		const currentFight = this.props.currentFight

		const jobMeta = AVAILABLE_MODULES.JOBS

		// Filter down to just the friendlies in this fight (that aren't limit break), grouping by role
		const grouped = [] // Relying on magic here
		friendlies && friendlies.forEach(friendly => {
			const inFight = friendly.fights.some(fight => fight.id === currentFight)
			const type = friendly.type
			if (type === 'LimitBreak' || !inFight) {
				return
			}

			// Get the job for the friendly. Gonna push jobs w/o a parser into a special group
			let role = ROLES.UNSUPPORTED.id
			if (type in jobMeta) {
				role = JOBS[type].role

				const supportedPatches = jobMeta[type].supportedPatches
				if (supportedPatches) {
					const {from, to = from} = supportedPatches
					if (!patchSupported(from, to, start)) {
						role = ROLES.OUTDATED.id
					}
				}
			}

			if (!grouped[role]) {
				grouped[role] = []
			}
			grouped[role].push(friendly)
		})

		// If there's no groups at all, the fight probably doesn't exist - show an error
		if (grouped.length === 0) {
			store.dispatch(setGlobalError(new Errors.NotFoundError({
				type: 'fight',
				id: currentFight,
			})))
			return null
		}

		let warningDisplayed = false

		return <>
			<Header>
				<Trans id="core.find.select-combatant">
					Select a combatant
				</Trans>
			</Header>

			{grouped.map((friends, index) => {
				const role = ROLES[index]
				const showWarning = !warningDisplayed && [
					ROLES.OUTDATED.id,
					ROLES.UNSUPPORTED.id,
				].includes(index)
				if (showWarning) {
					warningDisplayed = true
				}

				return <Fragment key={index}>
					{showWarning && <Message info icon>
						<Icon name="code" />
						<Message.Content>
							<Message.Header>
								<Trans id="core.find.job-unsupported.title">Favourite job unsupported?</Trans>
							</Message.Header>
							<p>
								<Trans id="core.find.job-unsupported.description">We're always looking to expand our support and accuracy. Come drop by our Discord channel and see how you could help out!</Trans>
							</p>
						</Message.Content>
					</Message>}

					<Segment color={role.colour} attached="top">
						<Trans id={role.i18n_id} defaults={role.name} />
					</Segment>
					<Menu fluid vertical attached="bottom">
						{friends.map(friend => {
							const job = JOBS[friend.type]
							const meta = jobMeta[friend.type]
							const supportedPatches = (meta || {}).supportedPatches

							return <Menu.Item
								key={friend.id}
								as={Link}
								className={styles.combatantLink}
								to={`/analyse/${this.props.report.code}/${currentFight}/${friend.id}/`}
							>
								{job && <JobIcon
									job={job}
									className={styles.jobIcon}
								/>}
								{friend.name}
								{supportedPatches && <span className={styles.supportedPatches}>
									{supportedPatches.from}{supportedPatches.from !== supportedPatches.to && `–${supportedPatches.to}`}
								</span>}
							</Menu.Item>
						})}
					</Menu>
				</Fragment>
			})}
		</>
	}
}

export default CombatantList
