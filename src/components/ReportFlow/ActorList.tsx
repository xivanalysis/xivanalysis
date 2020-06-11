import React from 'react'
import {ActorListRouteParams} from './ReportFlow'
import {useRouteMatch, Link} from 'react-router-dom'
import {ReportStore} from 'store/new/report'
import {Message} from 'akkd'
import {Trans} from '@lingui/react'
import JOBS, {Role, RoleKey, ROLES} from 'data/JOBS'
import {Actor} from 'report'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import styles from './ReportFlow.module.css'
import Color from 'color'
import JobIcon from 'components/ui/JobIcon'

interface RoleGroupData {
	role: Role
	actors: Actor[]
}

export interface ActorListProps {
	reportStore: ReportStore
}

export function ActorList({reportStore}: ActorListProps) {
	const {params: {pullId}} = useRouteMatch<ActorListRouteParams>()

	const pull = reportStore.report?.pulls.find(pull => pull.id === pullId)
	if (pull == null) {
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
	reportStore.fetchActors(pull)

	const actors = pull.actors
		.filter(actor => actor.playerControlled)

	const groups = new Map<RoleKey, RoleGroupData>()
	for (const actor of actors) {
		const job = JOBS[actor.job]

		let group = groups.get(job.role)
		if (group == null) {
			group = {role: ROLES[job.role], actors: []}
			groups.set(job.role, group)
		}

		group.actors.push(actor)
	}

	const sortedGroups = [...groups.values()]
		.sort((a, b) => a.role.id - b.role.id)

	return (
		<div className={styles.actorList}>
			{sortedGroups.map(group => (
				<RoleGroup key={group.role.id} group={group}/>
			))}
		</div>
	)
}

interface RoleGroupProps {
	group: RoleGroupData
}

function RoleGroup({group: {role, actors}}: RoleGroupProps) {
	const {url} = useRouteMatch()

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
				{actors.map(actor => (
					<Link to={`${url}/${actor.id}`} className={styles.link}>
						<span className={styles.text}>
							<JobIcon job={JOBS[actor.job]}/>
							{actor.name}
						</span>
					</Link>
				))}
			</div>
		</div>
	)
}
