import React, {ReactNode} from 'react'
import {ActorListRouteParams} from './ReportFlow'
import {useRouteMatch, Link} from 'react-router-dom'
import {ReportStore} from 'store/new/report'
import {Message, Segment} from 'akkd'
import {Trans} from '@lingui/react'
import JOBS, {Role, RoleKey, ROLES, Job} from 'data/JOBS'
import {Report, Actor, Pull} from 'report'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import styles from './ReportFlow.module.css'
import Color from 'color'
import JobIcon from 'components/ui/JobIcon'
import AVAILABLE_MODULES from 'parser/AVAILABLE_MODULES'
import {patchSupported} from 'data/PATCHES'

interface RoleGroupData {
	role: Role
	actors: Actor[]
}

const UNSUPPORTED_ROLES = [
	ROLES.UNSUPPORTED,
	ROLES.OUTDATED,
]

export interface ActorListProps {
	reportStore: ReportStore
}

export function ActorList({reportStore}: ActorListProps) {
	const {params: {pullId}} = useRouteMatch<ActorListRouteParams>()

	const {report} = reportStore
	const pull = report?.pulls.find(pull => pull.id === pullId)
	if (report == null || pull == null) {
		return (
			<Message warning icon="warning sign">
				<Trans id="core.report-flow.pull-not-found">
					<Message.Header>Pull not found.</Message.Header>
					No pull was found with ID "{pullId}". If this report has been updated recently, it may have been cached - try pressing Refresh to retrieve the latest data.
				</Trans>
			</Message>
		)
	}

	// Ensure actors are up to date
	reportStore.fetchActors(pullId)

	const actors = pull.actors
		.filter(actor => actor.playerControlled)

	const groups = new Map<RoleKey, RoleGroupData>()
	for (const actor of actors) {
		const job = JOBS[actor.job]
		const role = getJobRole(job, pull, report)

		let group = groups.get(role)
		if (group == null) {
			group = {role: ROLES[role], actors: []}
			groups.set(role, group)
		}

		group.actors.push(actor)
	}

	const sortedGroups = [...groups.values()]
		.sort((a, b) => a.role.id - b.role.id)

	let warningDisplayed = false
	return (
		<div className={styles.actorList}>
			{sortedGroups.map(group => {
				const showWarning = true
					&& !warningDisplayed
					&& UNSUPPORTED_ROLES.includes(group.role)
				if (showWarning) { warningDisplayed = true }

				return <>
					{showWarning && <UnsupportedWarning/>}
					<RoleGroup key={group.role.id} group={group}/>
				</>
			})}
		</div>
	)
}

function getJobRole(job: Job, pull: Pull, report: Report): RoleKey {
	// TODO: THIS WILL NEED TO BE CHANGED ONCE AVAILABLE MODULES IS USING JOB KEYS
	const jobMeta = AVAILABLE_MODULES.JOBS[job.logType]
	if (jobMeta == null) { return 'UNSUPPORTED' }

	const {supportedPatches} = jobMeta
	if (supportedPatches == null) { return 'UNSUPPORTED' }

	const {from, to = from} = supportedPatches

	return patchSupported( report.edition, from, to, pull.timestamp / 1000)
		? job.role
		: 'OUTDATED'
}

const UnsupportedWarning = () => (
	<Segment><Message info icon="code">
		<Message.Header><Trans id="core.report-flow.job-unsupported.title" render="strong">Favourite job unsupported?</Trans></Message.Header>
		<Trans id="core.report-flow.job-unsupported.description">We're always looking to expand our support and accuracy. Come drop by our Discord channel and see how you could help out!</Trans>
	</Message></Segment>
)

interface RoleGroupProps {
	group: RoleGroupData
}

function RoleGroup({group: {role, actors}}: RoleGroupProps) {
	// tslint:disable:no-magic-numbers
	const background = Color(role.colour).fade(0.8).toString()
	const color = Color(role.colour).darken(0.5).toString()
	// tslint:enable:no-magic-numbers

	return (
		<div className={styles.group}>
			<h2 style={{background, color}}>
				<NormalisedMessage message={role.name}/>
			</h2>

			<div className={styles.links}>
				{actors.map(actor => <ActorLink key={actor.id} actor={actor}/>)}
			</div>
		</div>
	)
}

interface ActorLinkProps {
	actor: Actor
}

function ActorLink({actor}: ActorLinkProps) {
	const {url} = useRouteMatch()

	const job = JOBS[actor.job]
	// TODO: THIS WILL NEED TO BE CHANGED ONCE AVAILABLE MODULES IS USING JOB KEYS
	const jobMeta = AVAILABLE_MODULES.JOBS[job.logType]

	let supportedPatches: ReactNode
	if (jobMeta?.supportedPatches != null) {
		const {from, to = from} = jobMeta.supportedPatches
		supportedPatches = (
			<Trans id="core.report-flow.supported-patches">
				Patch {from}{from !== to ? `-${to}` : ''}
			</Trans>
		)
	}

	return (
		<Link key={actor.id} to={`${url}/${actor.id}`} className={styles.link}>
			<span className={styles.text}>
				<JobIcon job={job}/>
				{actor.name}
			</span>

			{supportedPatches && (
				<span className={styles.meta}>
					{supportedPatches}
				</span>
			)}
		</Link>
	)
}
