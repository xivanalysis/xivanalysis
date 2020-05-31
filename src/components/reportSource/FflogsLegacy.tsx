import React from 'react'
import {useRouteMatch, Switch, Route, Redirect, useParams} from 'react-router-dom'
import {FflogsLegacyReportStore} from 'store/new/report'
import {observer} from 'mobx-react'
import {Loader} from 'semantic-ui-react'
import {ReportStoreContext, ReportFlow} from 'components/ReportFlowfoo'
import {useLazyRef} from 'utilities/react'

interface RouteParams {
	code: string
}

/**
 * Report source component for adapting the legacy report store into the new flow.
 * This should be removed once migration away from the legacy report store is complete.
 */
export function FflogsLegacy() {
	const {path} = useRouteMatch()
	return (
		<Switch>
			{/* Can't do anything without a report code, redirect to the home page */}
			<Redirect path={path} exact to="/"/>

			<Route path={`${path}/:code`}><WithCode/></Route>
		</Switch>
	)
}

const WithCode = observer(function WithCode() {
	const {code} = useParams<RouteParams>()

	// Get a stable reference to the store and ensure we've requested a report for the current code
	const reportStore = useLazyRef(() => new FflogsLegacyReportStore()).current
	reportStore.fetchReport(code)

	// We can safely assume that a null report means we're loading due to the  legacy store semantics.
	if (reportStore.report == null) {
		return (
			<Loader active>
				{/* TODO: Trans */}
				Loading report
			</Loader>
		)
	}

	return (
		<ReportStoreContext.Provider value={reportStore}>
			<ReportFlow/>
		</ReportStoreContext.Provider>
	)
})
