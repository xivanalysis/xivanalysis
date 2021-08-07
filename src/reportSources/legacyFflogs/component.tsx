import {ReportFlow, buildReportFlowPath} from 'components/ReportFlow'
import {ReportLoader} from 'components/ui/SharedLoaders'
import {getEncounterKey} from 'data/ENCOUNTERS'
import _ from 'lodash'
import {observer} from 'mobx-react'
import React, {useEffect} from 'react'
import {useRouteMatch, Switch, Route, Redirect, useParams} from 'react-router-dom'
import {ReportStore} from 'reportSources'
import {useLazyRef} from 'utilities/react'
import {LegacyFflogsReportStore} from './store'

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
	useEffect(() => reportStore.requestReport(code), [code, reportStore])

	// We can safely assume that a null report means we're loading due to the legacy store semantics.
	if (reportStore.report == null) {
		return <ReportLoader/>
	}

	return <Component reportStore={reportStore} baseUrl={baseUrl}/>
})

function LastFightRedirect({reportStore, baseUrl}: WithReportComponentProps) {
	const {code, source} = useParams<LastFightRedirectParams>()

	// Filter out trash pulls
	const pullIds = reportStore.report?.meta.fights
		.filter(fight => getEncounterKey('legacyFflogs', fight.boss.toString()) !== 'TRASH')
		.map(fight => fight.id.toString())

	const lastPull = _.last(pullIds)
	const path = `${baseUrl}/${code}${buildReportFlowPath(lastPull, source)}`

	return <Redirect to={path}/>
}
