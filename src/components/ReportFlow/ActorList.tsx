import React from 'react'
import {ActorListRouteParams} from './ReportFlow'
import {useRouteMatch, Link} from 'react-router-dom'
import {ReportStore} from 'store/new/report'
import {Message} from 'akkd'
import {Trans} from '@lingui/react'

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
					<Message.Header>Not found.</Message.Header>
					No pull was found with ID "{pullId}". If this report has been updated recently, it may have been cached - try pressing Refresh to retrieve the latest data.
				</Trans>
			</Message>
		)
	}

	// Ensure actors are up to date
	reportStore.fetchActors(pull)

	const actors = pull.actors
		.filter(actor => actor.playerControlled)

	return (
		<ul>
			{actors.map(actor => (
				<li key={actor.id}>
					<Link to={`${url}/${actor.id}`}>
						{actor.name} ({actor.job})
					</Link>
				</li>
			))}
		</ul>
	)
}
