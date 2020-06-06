import React from 'react'
import {useRouteMatch, Switch, Route, Redirect, useParams} from 'react-router-dom'
import {LegacyFflogsReportStore} from 'store/new/report'
import {observer} from 'mobx-react'
import {ReportStoreContext, ReportFlow} from 'components/ReportFlow'
import {useLazyRef} from 'utilities/react'
import {ReportLoader} from 'components/ui/SharedLoaders'

interface RouteParams {
	code: string
}

/**
 * Report source component for adapting the legacy report store into the new flow.
 * This should be removed once migration away from the legacy report store is complete.
 */
export function LegacyFflogs() {
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
	const reportStore = useLazyRef(() => new LegacyFflogsReportStore()).current
	reportStore.fetchReport(code)

	// We can safely assume that a null report means we're loading due to the legacy store semantics.
	if (reportStore.report == null) {
		return <ReportLoader/>
	}

	return (
		<ReportStoreContext.Provider value={reportStore}>
			<ReportFlow/>
		</ReportStoreContext.Provider>
	)
})
