import React, {useContext} from 'react'
import {ReportStoreContext} from './ReportFlow'
import {Duty, Pull} from 'store/new/report'


interface PullGroup {
	duty: Duty
	pulls: Pull[]
}

export function PullList() {
	const reportStore = useContext(ReportStoreContext)

	// TODO: How can I avoid this constant repetition of existence check?
	//       Do I want to?
	if (reportStore.report == null) {
		return null
	}

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
					<li>{pull.encounter.name}</li>
				))}
			</ul>
		</>)}
	</>
}
