import {Trans} from '@lingui/react'
import * as Sentry from '@sentry/browser'
import {Message} from 'akkd'
import classNames from 'classnames'
import {SidebarContent} from 'components/GlobalSidebar'
import {JobIcon} from 'components/ui/JobIcon'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {AnalysisLoader} from 'components/ui/SharedLoaders'
import {JOBS, ROLES} from 'data/JOBS'
import {Conductor} from 'parser/Conductor'
import {Result} from 'parser/core/Parser'
import React, {useCallback, useContext, useState} from 'react'
import {useParams} from 'react-router-dom'
import {Actor, Pull, Report} from 'report'
import {ReportStore} from 'reportSources'
import {Header, Icon} from 'semantic-ui-react'
import {StoreContext} from 'store'
import {AnalyseRouteParams} from '../ReportFlow'
import reportFlowStyles from '../ReportFlow.module.css'
import styles from './Analyse.module.css'
import {ResultSegment} from './ResultSegment'
import {SegmentLinkItem} from './SegmentLinkItem'
import {SegmentPositionProvider} from './SegmentPositionContext'

export interface AnalyseProps {
	reportStore: ReportStore
}

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

				<button
					className={classNames(reportFlowStyles.refresh, reportFlowStyles.block)}
					onClick={onRefreshActors}
				>
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

// TODO: this can probably be comvined with the component above
function AnalyseEvents({report, reportStore}: AnalyseEventsProps) {
	const {pullId, actorId} = useParams<AnalyseRouteParams>()
	const {globalErrorStore} = useContext(StoreContext)

	const [results, setResults] = useState<readonly Result[]>()

	React.useEffect(() => {
		analyseReport(reportStore, report, pullId, actorId)
			.then(setResults)
			.catch(error => {
				Sentry.captureException(error)
				globalErrorStore.setGlobalError(error)
			})
	}, [reportStore, report, pullId, actorId, globalErrorStore])

	if (results == null) {
		return <AnalysisLoader/>
	}

	// TODO: this drilling is done like 3-4 times in the analysis flow, fix
	const actor = report
		.pulls.find(pull => pull.id === pullId)
		?.actors.find(actor => actor.id === actorId)

	if (actor == null) {
		return <>TODO: actor null in inner component, fix</>
	}

	const job = JOBS[actor.job]
	const role = ROLES[job.role]

	return (
		<SegmentPositionProvider>
			<SidebarContent>
				{job && (
					<Header className={styles.header}>
						<JobIcon job={job}/>
						<Header.Content>
							<NormalisedMessage message={job.name}/>
							<Header.Subheader>
								<NormalisedMessage message={role.name}/>
							</Header.Subheader>
						</Header.Content>
					</Header>
				)}

				{results.map((result, index) => (
					<SegmentLinkItem
						key={result.handle}
						index={index}
						result={result}
					/>
				))}
			</SidebarContent>

			<div className={styles.resultsContainer}>
				{results.map((result, index) => (
					<ResultSegment key={result.handle} index={index} result={result}/>
				))}
			</div>
		</SegmentPositionProvider>
	)
}

// TODO: Conductor can probably be flattened into this eventually
// TODO: fix call sig
async function analyseReport(reportStore: ReportStore, report: Report, pullId: Pull['id'], actorId: Actor['id']) {
	// Set up the parser for this analysis
	const conductor = new Conductor({
		report,
		pullId,
		actorId,
	})

	// Conductor configuration and event fetching can be executed simultaneously
	const [events] = await Promise.all([
		reportStore.fetchEvents(pullId, actorId),
		conductor.configure(),
	])

	await conductor.parse({reportFlowEvents: events})

	return conductor.getResults()
}
