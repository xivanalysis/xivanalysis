import React, {useContext} from 'react'
import {ReportStoreContext} from './ReportFlow'
import {useRouteMatch, Link} from 'react-router-dom'
import {Job} from 'store/new/report'

// Keep in sync with Route path in ReportFlow
interface ActorListRouteParams {
	pullId: string
}

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

	const actors = pull.actors
		.filter(actor => actor.playerControlled)

	return (
		<ul>
			{actors.map(actor => (
				<li key={actor.id}>
					<Link to={`${url}/${actor.id}`}>
						{actor.name} ({Job[actor.job]})
					</Link>
				</li>
			))}
		</ul>
	)
}
