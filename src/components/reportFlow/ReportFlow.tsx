import React, {useContext, createContext} from 'react'
import {ReportStore} from 'store/new/report'
import {Message} from 'akkd'
import {Switch, useRouteMatch, Route} from 'react-router-dom'
import {PullList} from './PullList'
import {ActorList} from './ActorList'
import {Analyse} from './Analyse'

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
