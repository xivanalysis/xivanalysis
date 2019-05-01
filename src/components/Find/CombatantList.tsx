import {Trans} from '@lingui/react'
import {convertToJob} from '@xivanalysis/parser-reader-fflogs'
import {List, Message, Segment} from 'akkd'
import * as AVAILABLE_MODULES from 'analyser/AVAILABLE_MODULES'
import Color from 'color'
import JobIcon from 'components/ui/JobIcon'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {getDataBy} from 'data'
import JOBS, {Role, ROLES} from 'data/JOBS'
import {languageToEdition, PatchNumber, patchSupported} from 'data/PATCHES'
import * as Errors from 'errors'
import {Actor, ActorType} from 'fflogs'
import {computed} from 'mobx'
import {inject, observer} from 'mobx-react'
import React from 'react'
import {Link} from 'react-router-dom'
import {Header} from 'semantic-ui-react'
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
			if (
				type === ActorType.LIMIT_BREAK ||
				type === ActorType.NPC ||
				!inFight
			) {
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
		const job = convertToJob(type)
		const jobMeta = AVAILABLE_MODULES.JOBS[job]

		// If there's no meta for the job, it's unsupported
		if (!jobMeta) {
			return ROLES.UNSUPPORTED.id
		}

		// Check if the job is supported, but outdated
		const supportedPatches = jobMeta.supportedPatches
		if (!supportedPatches) {
			return ROLES.OUTDATED.id
		}
		const {lang, start} = this.props.report
		const from = supportedPatches.from as PatchNumber
		const to = (supportedPatches.to as PatchNumber) || from
		if (!patchSupported(languageToEdition(lang), from, to, start)) {
			return ROLES.OUTDATED.id
		}

		// Supported and up to date, add to the proper job role
		// TODO: Update JOBS to use parser types
		const jobData = getDataBy(JOBS, 'job', job)
		if (!jobData) {
			throw new Error(`No configured job data found for type '${type}'`)
		}
		return jobData.role
	}

	render() {
		const globalErrorStore = this.props.globalErrorStore!

		// If there's no groups at all, the fight probably doesn't exist - show an error
		if (this.groupedActors.length === 0) {
			globalErrorStore.setGlobalError(new Errors.NotFoundError({
				type: 'fight',
			}))
			return null
		}

		let warningDisplayed = false

		return (
			<Segment>
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

					return <React.Fragment key={index}>
						{showWarning && this.renderWarning()}
						{this.renderGroup(role, friends)}
					</React.Fragment>
				})}
			</Segment>
		)
	}

	private renderWarning = () => (
		<Message info icon="code">
			<Message.Header><Trans id="core.find.job-unsupported.title" render="strong">Favourite job unsupported?</Trans></Message.Header>
			<Trans id="core.find.job-unsupported.description">We're always looking to expand our support and accuracy. Come drop by our Discord channel and see how you could help out!</Trans>
		</Message>
	)

	private renderGroup = (role: Role, friends: Actor[]) => {
		// tslint:disable:no-magic-numbers
		const background = Color(role.colour).fade(0.8).toString()
		const color = Color(role.colour).darken(0.5).toString()
		// tslint:enable:no-magic-numbers
		return (
			<List color={role.colour}>
				<List.Item style={{background, color}}>
					<strong><NormalisedMessage message={role.name}/></strong>
				</List.Item>

				{friends.map(friend => <React.Fragment key={friend.id}>
					{this.renderFriend(friend)}
				</React.Fragment>)}
			</List>
		)
	}

	private renderFriend = (friend: Actor) => {
		const {report, currentFight} = this.props
		const job = convertToJob(friend.type)
		const jobData = getDataBy(JOBS, 'job', job)

		const jobMeta = AVAILABLE_MODULES.JOBS[job]
		const supportedPatchesData = jobMeta
			? jobMeta.supportedPatches
			: undefined

		let supportedPatches: React.ReactNode
		if (supportedPatchesData) {
			const from = supportedPatchesData.from
			const to = supportedPatchesData.to || from

			supportedPatches = (
				<Trans id="core.find.supported-patches">
					Patch {from}{from !== to? `–${to}` : ''}
				</Trans>
			)
		}

		return (
			<List.Item
				as={Link}
				to={`/fflogs/${report.code}/${currentFight}/${friend.id}/`}
				className={styles.friendLink}
			>
				{jobData && <JobIcon job={jobData}/>}
				{friend.name}
				{supportedPatches && (
					<span className={styles.supportedPatches}>
						{supportedPatches}
					</span>
				)}
			</List.Item>
		)
	}
}

export default CombatantList
