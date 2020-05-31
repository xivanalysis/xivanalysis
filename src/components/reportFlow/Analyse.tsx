import React from 'react'
import {useParams} from 'react-router-dom'

// Keep in sync with Route path in ReportFlow
interface AnalyseRouteParams {
	pullId: string
	actorId: string
}

export function Analyse() {
	const {pullId, actorId} = useParams<AnalyseRouteParams>()
	return <>Analyse {pullId}-{actorId}</>
}
