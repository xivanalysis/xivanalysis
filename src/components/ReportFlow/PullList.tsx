import React, {useContext} from 'react'
import {ReportStoreContext} from './ReportFlow'
import {Duty, Pull} from 'store/new/report'
import {Link, useRouteMatch} from 'react-router-dom'

interface PullGroup {
	duty: Duty
	pulls: Pull[]
}

export function PullList() {
	const reportStore = useContext(ReportStoreContext)
	const {url} = useRouteMatch()

	// TODO: How can I avoid this constant repetition of existence check?
	//       Do I want to?
	if (reportStore.report == null) {
		return null
	}

	// Ensure pulls are up to date
	reportStore.fetchPulls()

	// Group encounters by the duty they took place in
	// We're maintaining chronological order, so only tracking the latest duty
	const groups: PullGroup[] = []
	let currentDuty: Duty['id'] | undefined

	for (const pull of reportStore.report.pulls) {
		const {duty} = pull.encounter
		if (duty.id !== currentDuty) {
			groups.push({duty, pulls: []})
			currentDuty = duty.id
		}

		groups[groups.length - 1].pulls.push(pull)
	}

	// TODO: this nicer
	return <>
		{groups.map(group => <>
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
		</>)}
	</>
}
