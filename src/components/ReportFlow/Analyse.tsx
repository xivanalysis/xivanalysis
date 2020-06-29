import React from 'react'
import {useParams} from 'react-router-dom'
import {AnalyseRouteParams} from './ReportFlow'
import {Analyse as LegacyAnalyse} from 'components/LegacyAnalyse'
import {ReportStore} from 'reportSources'
import {Message} from 'akkd'

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

	if (report == null) {
		return null
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

	const legacyReport = report.meta

	return (
		<LegacyAnalyse
			report={report}
			legacyReport={legacyReport}
			pullId={pullId}
			actorId={actorId}
		/>
	)
}
