import React from 'react'
import {useParams} from 'react-router-dom'
import {AnalyseRouteParams} from './ReportFlow'

export function Analyse() {
	const {pullId, actorId} = useParams<AnalyseRouteParams>()
	return <>Analyse {pullId}-{actorId}</>
}
