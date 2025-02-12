import {ReportFlow, buildReportFlowPath} from 'components/ReportFlow'
import {ReportLoader} from 'components/ui/SharedLoaders'
import {getEncounterKey} from 'data/ENCOUNTERS'
import _ from 'lodash'
import {observer} from 'mobx-react'
import {ComponentType, useEffect} from 'react'
import {Route, useParams, Routes, Navigate, useLocation} from 'react-router-dom'
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
	const {pathname} = useLocation()
	return (
		<Routes>
			{/* Can't do anything without a report code, redirect to the home page */}
			<Route index={true} element={<Navigate to="/" replace={true}/>}/>

			<Route
				path={`last/:code/:source?`}
				element={<WithReport Component={LastFightRedirect} baseUrl={pathname}/>}
			/>

			<Route
				path={`:code`}
				element={<WithReport Component={ReportFlow} baseUrl={pathname}/>}
			/>
		</Routes>
	)
}

interface WithReportComponentProps {
	reportStore: ReportStore
	baseUrl: string
}

interface WithReportProps {
	Component: ComponentType<WithReportComponentProps>
	baseUrl: string
}

const WithReport = observer(function WithReport(
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

	return <Navigate to={path} replace={true}/>
}
