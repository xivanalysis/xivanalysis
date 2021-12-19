import * as Sentry from '@sentry/browser'
import {SidebarContent} from 'components/GlobalSidebar'
import {JobIcon} from 'components/ui/JobIcon'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {AnalysisLoader} from 'components/ui/SharedLoaders'
import {JOBS, ROLES} from 'data/JOBS'
import {Conductor} from 'parser/Conductor'
import {Result} from 'parser/core/Parser'
import React, {useContext, useState} from 'react'
import {Actor, Pull, Report} from 'report'
import {ReportStore} from 'reportSources'
import {Header} from 'semantic-ui-react'
import {StoreContext} from 'store'
import styles from './Analyse.module.css'
import {ResultSegment} from './ResultSegment'
import {SegmentLinkItem} from './SegmentLinkItem'
import {SegmentPositionProvider} from './SegmentPositionContext'

export interface AnalyseProps {
	reportStore: ReportStore
	report: Report
	pull: Pull
	actor: Actor
}

export function Analyse({reportStore, report, pull, actor}: AnalyseProps) {
	const {globalErrorStore} = useContext(StoreContext)

	const [results, setResults] = useState<readonly Result[]>()

	React.useEffect(() => {
		analyseReport(reportStore, report, pull, actor)
			.then(setResults)
			.catch(error => {
				Sentry.captureException(error)
				globalErrorStore.setGlobalError(error)
			})
	}, [reportStore, report, pull, actor, globalErrorStore])

	if (results == null) {
		return <AnalysisLoader/>
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
async function analyseReport(
	reportStore: ReportStore,
	report: Report,
	pull: Pull,
	actor: Actor
) {
	// Set up the parser for this analysis
	const conductor = new Conductor({
		report,
		pull,
		actor,
	})

	// Conductor configuration and event fetching can be executed simultaneously
	const [events] = await Promise.all([
		reportStore.fetchEvents(pull.id, actor.id),
		conductor.configure(),
	])

	await conductor.parse({reportFlowEvents: events})

	return conductor.getResults()
}
