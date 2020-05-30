import React, {useContext, createContext} from 'react'
import {ReportStore} from 'store/new/report'
import {Message} from 'akkd'
import {Switch, useRouteMatch, Route} from 'react-router-dom'
import {PullList} from './PullList'

// TODO: I am _not_ convinced by needing the context. Think about it.
class NoOpReportStore extends ReportStore { report = undefined }
export const ReportStoreContext = createContext<ReportStore>(new NoOpReportStore())

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
			<Route path={`${path}/:pull/:actor`} component={Analyse}/>
			<Route path={`${path}/:pull`} component={ActorList}/>
			<Route path={path} component={PullList}/>
		</Switch>
	)
}

// These probably should be moved to their own files

function ActorList() {
	return <>ActorList</>
}

function Analyse() {
	return <>Analyse</>
}
