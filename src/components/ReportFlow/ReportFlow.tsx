import React, {useContext, createContext} from 'react'
import {ReportStore, Report} from 'store/new/report'
import {Message} from 'akkd'
import {Switch, useRouteMatch, Route, useParams} from 'react-router-dom'
import {PullList} from './PullList'
import {ActorList} from './ActorList'
import {Analyse} from './Analyse'
import {Breadcrumb, BreadcrumbsBanner} from 'components/GlobalSidebar'
import {getZoneBanner} from 'data/BOSSES'

export interface ActorListRouteParams {
	pullId: string
}

export interface AnalyseRouteParams {
	pullId: string
	actorId: string
}

// TODO: I am _not_ convinced by needing the context. Think about it.
class NoOpReportStore extends ReportStore { report = undefined }
export const ReportStoreContext = createContext<ReportStore>(new NoOpReportStore())

/**
 * Generic report flow component, to be nested inside a report source providing
 * source-specific report handling. Parent report sources must provide a report
 * store over context for consumption by the flow.
 */
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

	return <>
		<Breadcrumb path={path}>
			<ReportCrumb report={reportStore.report}/>
		</Breadcrumb>
		<Breadcrumb path={`${path}/:pullId`}>
			<PullCrumb report={reportStore.report}/>
		</Breadcrumb>
		<Breadcrumb path={`${path}/:pullId/:actorId`}>
			<ActorCrumb report={reportStore.report}/>
		</Breadcrumb>

		<Switch>
			<Route path={`${path}/:pullId/:actorId`}><Analyse/></Route>
			<Route path={`${path}/:pullId`}><ActorList/></Route>
			<Route path={path}><PullList/></Route>
		</Switch>
	</>
}

interface CrumbProps {
	report: Report
}

function ReportCrumb({report}: CrumbProps) {
	return <>{report.name}</>
}

function PullCrumb({report}: CrumbProps) {
	const {pullId} = useParams<ActorListRouteParams>()

	const encounter = report.pulls
		.find(pull => pull.id === pullId)
		?.encounter

	const banner = encounter?.duty.id != null
		? getZoneBanner(encounter.duty.id)
		: undefined

	return <>
		{encounter?.name ?? 'Unknown'}
		<BreadcrumbsBanner banner={banner}/>
	</>
}

function ActorCrumb({report}: CrumbProps) {
	const {pullId, actorId} = useParams<AnalyseRouteParams>()

	const name = report.pulls
		.find(pull => pull.id === pullId)
		?.actors
		.find(actor => actor.id === actorId)
		?.name

	return <>{name ?? 'Unknown'}</>
}
