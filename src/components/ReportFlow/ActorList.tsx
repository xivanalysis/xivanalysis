import React from 'react'
import {ActorListRouteParams} from './ReportFlow'
import {useRouteMatch, Link} from 'react-router-dom'
import {ReportStore} from 'store/new/report'
import {Message} from 'akkd'
import {Trans} from '@lingui/react'
import JOBS, {Role, RoleKey, ROLES} from 'data/JOBS'
import {Actor} from 'report'
import NormalisedMessage from 'components/ui/NormalisedMessage'

interface RoleGroupData {
	role: Role
	actors: Actor[]
}

export interface ActorListProps {
	reportStore: ReportStore
}

export function ActorList({reportStore}: ActorListProps) {
	const {params: {pullId}, url} = useRouteMatch<ActorListRouteParams>()

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

	return <>
		{sortedGroups.map(group => (
			<RoleGroup key={group.role.id} group={group}/>
		))}
	</>
}

interface RoleGroupProps {
	group: RoleGroupData
}

function RoleGroup({group}: RoleGroupProps) {
	const {url} = useRouteMatch()

	return <>
		<h2>
			<NormalisedMessage message={group.role.name}/>
		</h2>

		<ul>
			{group.actors.map(actor => (
				<li key={actor.id}>
					<Link to={`${url}/${actor.id}`}>
						{actor.name} ({actor.job})
					</Link>
				</li>
			))}
		</ul>
	</>
}
