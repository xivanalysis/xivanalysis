import React from 'react'
import {useRouteMatch, Switch, Route, Redirect, useParams} from 'react-router-dom'
import {LegacyFflogsReportStore} from './store'
import {observer} from 'mobx-react'
import {ReportFlow, buildReportFlowPath} from 'components/ReportFlow'
import {useLazyRef} from 'utilities/react'
import {ReportLoader} from 'components/ui/SharedLoaders'
import {ReportStore} from 'reportSources'
import _ from 'lodash'

interface WithCodeParams {
	code: string
}

interface LastFightRedirectParams extends WithCodeParams {
	source?: string
}

/**
 * Report source component for adapting the legacy report store into the new flow.
 * This should be removed once migration away from the legacy report store is complete.
 */
export function LegacyFflogs() {
	const {path, url} = useRouteMatch()
	return (
		<Switch>
			{/* Can't do anything without a report code, redirect to the home page */}
			<Redirect path={path} exact to="/"/>

			<Route path={`${path}/last/:code/:source?`}>
				<WithReport Component={LastFightRedirect} baseUrl={url}/>
			</Route>

			<Route path={`${path}/:code`}>
				<WithReport Component={ReportFlow} baseUrl={url}/>
			</Route>
		</Switch>
	)
}

interface WithReportComponentProps {
	reportStore: ReportStore
	baseUrl: string
}

interface WithReportProps {
	Component: React.ComponentType<WithReportComponentProps>
	baseUrl: string
}

const WithReport = observer(function WithCode(
	{Component, baseUrl}: WithReportProps,
) {
	const {code} = useParams<WithCodeParams>()

	// Get a stable reference to the store and ensure we've requested a report for the current code
	const reportStore = useLazyRef(() => new LegacyFflogsReportStore()).current
	reportStore.fetchReport(code)

	// We can safely assume that a null report means we're loading due to the legacy store semantics.
	if (reportStore.report == null) {
		return <ReportLoader/>
	}

	return <Component reportStore={reportStore} baseUrl={baseUrl}/>
})

function LastFightRedirect({reportStore, baseUrl}: WithReportComponentProps) {
	const {code, source} = useParams<LastFightRedirectParams>()

	const lastPull = _.last(reportStore.report?.pulls)?.id
	const path = `${baseUrl}/${code}${buildReportFlowPath(lastPull, source)}`

	return <Redirect to={path}/>
}
