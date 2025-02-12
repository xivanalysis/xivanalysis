import {ReportFlow, buildReportFlowPath} from 'components/ReportFlow'
import {ReportLoader} from 'components/ui/SharedLoaders'
import {getEncounterKey} from 'data/ENCOUNTERS'
import _ from 'lodash'
import {observer} from 'mobx-react'
import {ComponentType, useEffect} from 'react'
import {Route, useParams, Routes, Navigate, useResolvedPath} from 'react-router-dom'
import {ReportStore} from 'reportSources'
import {useLazyRef} from 'utilities/react'
import {LegacyFflogsReportStore} from './store'

/**
 * Report source component for adapting the legacy report store into the new flow.
 * This should be removed once migration away from the legacy report store is complete.
 */
export function LegacyFflogs() {
	return (
		<Routes>
			{/* Can't do anything without a report code, redirect to the home page */}
			<Route index={true} element={<Navigate to="/" replace={true}/>}/>

			<Route
				path="last/:code/:source?"
				element={<WithReport Component={LastFightRedirect}/>}
			/>

			<Route path=":code">
				<Route index path="*" element={<WithReport Component={ReportFlow}/>}/>
			</Route>
		</Routes>
	)
}

interface WithReportComponentProps {
	reportStore: ReportStore
}

interface WithReportProps {
	Component: ComponentType<WithReportComponentProps>
}

const WithReport = observer(function WithReport({
	Component,
}: WithReportProps) {
	const {code} = useParams()
	if (code == null) {
		throw new Error('Invariant broken.')
	}

	// Get a stable reference to the store and ensure we've requested a report for the current code
	const reportStore = useLazyRef(() => new LegacyFflogsReportStore()).current
	useEffect(() => reportStore.requestReport(code), [code, reportStore])

	// We can safely assume that a null report means we're loading due to the legacy store semantics.
	if (reportStore.report == null) {
		return <ReportLoader/>
	}

	return <Component reportStore={reportStore}/>
})

function LastFightRedirect({reportStore}: WithReportComponentProps) {
	const {pathname} =  useResolvedPath('..')
	const {code, source} = useParams()

	// Filter out trash pulls
	const pullIds = reportStore.report?.meta.fights
		.filter(fight => getEncounterKey('legacyFflogs', fight.boss.toString()) !== 'TRASH')
		.map(fight => fight.id.toString())

	const lastPull = _.last(pullIds)
	const path = `${pathname}/${code}${buildReportFlowPath(lastPull, source)}`

	return <Navigate to={path} replace={true}/>
}
