import React from 'react'
import {useParams} from 'react-router-dom'
import {AnalyseRouteParams} from './ReportFlow'
import {Analyse as LegacyAnalyse} from 'components/Analyse'
import {ReportStore} from 'store/new/report'

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
		return <>TODO: Error message about only supporting legacy mode at the moment</>
	}

	const legacyReport = report.meta

	return (
		<LegacyAnalyse
			report={legacyReport}
			fight={pullId}
			combatant={actorId}
		/>
	)
}
