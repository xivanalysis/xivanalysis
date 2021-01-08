import React, {useCallback} from 'react'
import {Trans} from '@lingui/react'
import {Message} from 'akkd'
import classNames from 'classnames'
import {Analyse as LegacyAnalyse} from 'components/LegacyAnalyse'
import {Event} from 'event'
import {useParams} from 'react-router-dom'
import {ReportStore} from 'reportSources'
import {Icon} from 'semantic-ui-react'
import {AnalyseRouteParams} from './ReportFlow'
import styles from './ReportFlow.module.css'
import {Report} from 'report'
import {AnalysisLoader} from 'components/ui/SharedLoaders'

export interface AnalyseProps {
	reportStore: ReportStore
}

/**
 * This component currently acts as a pass-through adapter to the old Analyse.js
 * component. It'll need to be replaced in due time, once the new report system
 * is adopted.
 */
export function Analyse({reportStore}: AnalyseProps) {
	const {report} = reportStore
	const {pullId, actorId} = useParams<AnalyseRouteParams>()

	const onRefreshActors = useCallback(
		() => reportStore.requestActors(pullId, {bypassCache: true}),
		[reportStore, pullId],
	)

	const actor = report
		?.pulls.find(pull => pull.id === pullId)
		?.actors.find(actor => actor.id === actorId)

	if (report == null || actor == null) {
		return (
			<Message warning icon="warning sign">
				<Trans id="core.report-flow.actor-not-found">
					<Message.Header>Actor not found.</Message.Header>
					No actor was found with ID "{actorId}". If this report has been updated recently, it may have been cached - try pressing Refresh to retrieve the latest data.
				</Trans>

				<button className={classNames(styles.refresh, styles.block)} onClick={onRefreshActors}>
					<Icon name="refresh"/>
					<Trans id="core.report-flow.refresh">Refresh</Trans>
				</button>
			</Message>
		)
	}

	if (report.meta?.source !== 'legacyFflogs') {
		// This is intentionally not translated at the moment.
		return (
			<Message error>
				<Message.Header>Unsupported report source.</Message.Header>
				This report was sourced from "{report.meta?.source}", which is not supported at this time.
			</Message>
		)
	}

	return (
		<AnalyseEvents
			reportStore={reportStore}
			report={report}
		/>
	)
}

interface AnalyseEventsProps {
	reportStore: ReportStore
	report: Report
}

function AnalyseEvents({report, reportStore}: AnalyseEventsProps) {
	const {pullId, actorId} = useParams<AnalyseRouteParams>()

	// We have a definitive report that's ready to go - fetch the events and start the analysis
	const [events, setEvents] = React.useState<Event[]>()
	React.useEffect(() => {
		reportStore.fetchEvents(pullId, actorId).then(setEvents)
	}, [pullId, actorId, reportStore])

	if (events == null) {
		return <AnalysisLoader/>
	}

	return (
		<LegacyAnalyse
			report={report}
			legacyReport={report.meta}
			pullId={pullId}
			actorId={actorId}
			reportFlowEvents={events}
		/>
	)
}
