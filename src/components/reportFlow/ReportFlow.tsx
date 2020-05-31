import React, {useContext, createContext} from 'react'
import {ReportStore} from 'store/new/report'
import {Message} from 'akkd'
import {Switch, useRouteMatch, Route, useParams} from 'react-router-dom'
import {PullList} from './PullList'

// TODO: I am _not_ convinced by needing the context. Think about it.
class NoOpReportStore extends ReportStore { report = undefined }
export const ReportStoreContext = createContext<ReportStore>(new NoOpReportStore())

/**
 * Generic report flow component, to be nested inside a report source providing
 * source-specific report handling. Parent report sources must provide a report
 * store over context for consumption by the flow.
 */
export function ReportFlow() {
	const reportStore = useContext(ReportStoreContext)
	const {path} = useRouteMatch()

	if (reportStore.report == null) {
		return (
			// TODO: i18n
			<Message error>
				TODO: Helpful error message about there being no report data found
			</Message>
		)
	}

	return (
		<Switch>
			<Route path={`${path}/:pullId/:actorId`}><Analyse/></Route>
			<Route path={`${path}/:pullId`}><ActorList/></Route>
			<Route path={path}><PullList/></Route>
		</Switch>
	)
}

// These probably should be moved to their own files

// Keep in sync with Route path in ReportFlow
interface ActorListRouteParams {
	pullId: string
}

function ActorList() {
	const reportStore = useContext(ReportStoreContext)
	const {pullId} = useParams<ActorListRouteParams>()

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
				<li>
					{actor.name}
				</li>
			))}
		</ul>
	)
}

function Analyse() {
	return <>Analyse</>
}
