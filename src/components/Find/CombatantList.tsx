import {Trans} from '@lingui/react'
import JobIcon from 'components/ui/JobIcon'
import {getDataBy} from 'data'
import JOBS, {Role, ROLES} from 'data/JOBS'
import {PatchNumber, patchSupported} from 'data/PATCHES'
import * as Errors from 'errors'
import {Actor, ActorType} from 'fflogs'
import {computed} from 'mobx'
import {inject, observer} from 'mobx-react'
import AVAILABLE_MODULES from 'parser/AVAILABLE_MODULES'
import React, {Fragment} from 'react'
import {Link} from 'react-router-dom'
import {Header, Icon, Menu, Message, Segment} from 'semantic-ui-react'
import {GlobalErrorStore} from 'store/globalError'
import {Report} from 'store/report'
import styles from './CombatantList.module.css'

interface Props {
	globalErrorStore?: GlobalErrorStore
	report: Report,
	currentFight: number
}

@inject('globalErrorStore')
@observer
class CombatantList extends React.Component<Props> {
	@computed
	get groupedActors() {
		const {
			report: {
				friendlies = [],
				start,
			},
			currentFight,
		} = this.props

		if (!friendlies.length) {
			return []
		}

		return friendlies.reduce((groups, friendly) => {
			// Ignore LB and players not in the current fight
			const inFight = friendly.fights.some(fight => fight.id === currentFight)
			const type = friendly.type
			if (type === ActorType.LIMIT_BREAK || !inFight) {
				return groups
			}

			const role = this.findRole(type)

			if (!groups[role]) {
				groups[role] = []
			}
			groups[role].push(friendly)

			return groups
		}, [] as Actor[][])
	}

	findRole(type: ActorType): Role['id'] {
		const jobMeta = AVAILABLE_MODULES.JOBS

		// Find the role for the player's job.
		// Jobs without parses, and jobs with outdated parsers get special roles.
		let role = ROLES.UNSUPPORTED.id
		if (type in jobMeta) {
			const job = getDataBy(JOBS, 'logType', type)
			if (!job) { throw new Error(`No configured job data found for type '${type}'`) }
			role = job.role

			const supportedPatches = jobMeta[type].supportedPatches
			if (supportedPatches) {
				const from = supportedPatches.from as PatchNumber
				const to = (supportedPatches.to as PatchNumber) || from
				if (!patchSupported(from, to, this.props.report.start)) {
					role = ROLES.OUTDATED.id
				}
			}
		}

		return role
	}

	render() {
		const {report, currentFight} = this.props
		const globalErrorStore = this.props.globalErrorStore!

		// If there's no groups at all, the fight probably doesn't exist - show an error
		if (this.groupedActors.length === 0) {
			globalErrorStore.setGlobalError(new Errors.NotFoundError({
				type: 'fight',
			}))
			return null
		}

		let warningDisplayed = false

		return <>
			<Header>
				<Trans id="core.find.select-combatant">
					Select a combatant
				</Trans>
			</Header>

			{this.groupedActors.map((friends, index) => {
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
							const job = getDataBy(JOBS, 'logType', friend.type)
							const meta = AVAILABLE_MODULES.JOBS[friend.type]
							const supportedPatches = (meta || {}).supportedPatches

							return <Menu.Item
								key={friend.id}
								as={Link}
								className={styles.combatantLink}
								to={`/analyse/${report.code}/${currentFight}/${friend.id}/`}
							>
								{job && <JobIcon job={job}/>}
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
