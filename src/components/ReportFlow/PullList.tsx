import React from 'react'
import {Duty, Pull} from 'report'
import {Link, useRouteMatch} from 'react-router-dom'
import {ReportStore} from 'store/new/report'

interface PullGroupData {
	duty: Duty
	pulls: Pull[]
}

export interface PullListProps {
	reportStore: ReportStore
}

export function PullList({reportStore}: PullListProps) {
	if (reportStore.report == null) {
		return null
	}

	// Ensure pulls are up to date
	reportStore.fetchPulls()

	// Group encounters by the duty they took place in
	// We're maintaining chronological order, so only tracking the latest duty
	const groups: PullGroupData[] = []
	let currentDuty: Duty['id'] | undefined

	for (const pull of reportStore.report.pulls) {
		const {duty} = pull.encounter
		if (duty.id !== currentDuty) {
			groups.push({duty, pulls: []})
			currentDuty = duty.id
		}

		groups[groups.length - 1].pulls.push(pull)
	}

	return <>{groups.map(group => <PullGroup group={group}/>)}</>
}

interface PullGroupProps {
	group: PullGroupData
}

function PullGroup({group}: PullGroupProps) {
	const {url} = useRouteMatch()

	// TODO: this nicer
	return <>
		<h3>{group.duty.name}</h3>
		<ul>
			{group.pulls.map(pull => (
				<li key={pull.id}>
					<Link to={`${url}/${pull.id}`}>
						{pull.encounter.name}
					</Link>
				</li>
			))}
		</ul>
	</>
}
