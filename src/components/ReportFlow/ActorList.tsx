import React, {useContext} from 'react'
import {ReportStoreContext, ActorListRouteParams} from './ReportFlow'
import {useRouteMatch, Link} from 'react-router-dom'

export function ActorList() {
	const reportStore = useContext(ReportStoreContext)
	const {params: {pullId}, url} = useRouteMatch<ActorListRouteParams>()

	// TODO: Same as pull list. What do?
	if (reportStore.report == null) {
		return null
	}

	const pull = reportStore.report.pulls.find(pull => pull.id === pullId)

	// TODO: can likely be combined with the null above
	if (pull == null) {
		return <>TODO: message pull not found</>
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
