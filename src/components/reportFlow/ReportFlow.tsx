import React, {useContext, createContext} from 'react'
import {ReportStore, Duty, Pull} from 'store/new/report'
import {Message} from 'akkd'
import {Switch, useRouteMatch, Route} from 'react-router-dom'

// TODO: I am _not_ convinced by needing the context. Think about it.
class NoOpReportStore extends ReportStore { report = undefined }
export const ReportStoreContext = createContext<ReportStore>(new NoOpReportStore())

export function ReportFlow() {
	const reportStore = useContext(ReportStoreContext)
	const {path} = useRouteMatch()

	if (reportStore.report == null) {
		return (
			// TODO: i18n
			<Message error>
				TODO: Helpful error message about there being no report data found
			</Message>
		)
	}

	return (
		<Switch>
			<Route path={`${path}/:pull/:actor`} component={Analyse}/>
			<Route path={`${path}/:pull`} component={ActorList}/>
			<Route path={path} component={PullList}/>
		</Switch>
	)
}

// These probably should be moved to their own files

interface PullGroup {
	duty: Duty
	pulls: Pull[]
}

function PullList() {
	const reportStore = useContext(ReportStoreContext)

	// TODO: How can I avoid this constant repetition of existence check?
	//       Do I want to?
	if (reportStore.report == null) {
		return null
	}

	const groups: PullGroup[] = []
	// TODO: duty id? add?
	let currentDuty: Duty | undefined

	for (const pull of reportStore.report.pulls) {
		// todo yeah yeah
		const {duty} = pull.encounter
		if (duty !== currentDuty) {
			groups.push({duty, pulls: []})
			currentDuty = duty
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

function ActorList() {
	return <>ActorList</>
}

function Analyse() {
	return <>Analyse</>
}
