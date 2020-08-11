import React from 'react'
import {ReportStore} from 'reportSources'
import {Message} from 'akkd'
import {Switch, useRouteMatch, Route, useParams} from 'react-router-dom'
import {PullList} from './PullList'
import {ActorList} from './ActorList'
import {Analyse} from './Analyse'
import {BreadcrumbsBanner, Breadcrumb, ReportLinkContent} from 'components/GlobalSidebar'
import {Report} from 'report'
import {getPatch, GameEdition} from 'data/PATCHES'
import {Icon} from 'semantic-ui-react'
import {formatDuration} from 'utilities'
import {Trans} from '@lingui/react'
import {getDutyBanner} from 'data/ENCOUNTERS'
import styles from './ReportFlow.module.css'

export function buildReportFlowPath(pullId?: string, actorId?: string) {
	let path = ''
	if (pullId != null) {
		path += `/${pullId}`
		if (actorId != null) {
			path += `/${actorId}`
		}
	}
	return path
}

export interface ActorListRouteParams {
	pullId: string
}

export interface AnalyseRouteParams {
	pullId: string
	actorId: string
}

type ReportLinkRouteParams = Partial<AnalyseRouteParams>

export interface ReportFlowProps {
	reportStore: ReportStore
}

/**
 * Generic report flow component, to be nested inside a report source providing
 * source-specific report handling. Parent report sources must provide a report
 * store over context for consumption by the flow.
 */
export function ReportFlow({reportStore}: ReportFlowProps) {
	const {path, url} = useRouteMatch()

	// This is intentionally quite generic. If a specific report source can provide
	// more information, it should do so in the report source itself.
	if (reportStore.report == null) {
		return (
			<Message error icon="times circle outline">
				<Trans id="core.report-flow.report-not-found">
					<Message.Header>Report not found.</Message.Header>
					No report data was found for "{url}".
				</Trans>
			</Message>
		)
	}

	return <>
		<Route path={path}>
			<ReportCrumb report={reportStore.report}/>
		</Route>
		<Route path={`${path}/:pullId`}>
			<PullCrumb report={reportStore.report}/>
		</Route>
		<Route path={`${path}/:pullId/:actorId`}>
			<ActorCrumb report={reportStore.report}/>
		</Route>

		<Route path={`${path}/:pullId?/:actorId?`}>
			<ReportLink reportStore={reportStore}/>
		</Route>

		<Switch>
			<Route path={`${path}/:pullId/:actorId`}>
				<Analyse reportStore={reportStore}/>
			</Route>
			<Route path={`${path}/:pullId`}>
				<ActorList reportStore={reportStore}/>
			</Route>
			<Route path={path}>
				<PullList reportStore={reportStore}/>
			</Route>
		</Switch>
	</>
}

interface CrumbProps {
	report: Report
}

const editionName = {
	[GameEdition.GLOBAL]: <Icon name="globe"/>,
	[GameEdition.KOREAN]: 'KR',
	[GameEdition.CHINESE]: 'CN',
}

function ReportCrumb({report}: CrumbProps) {
	const {edition, timestamp, name} = report
	const patch = getPatch(edition, timestamp / 1000)
	const subtitle = <>({editionName[edition]} {patch})</>

	return <Breadcrumb title={name} subtitle={subtitle}/>
}

function PullCrumb({report}: CrumbProps) {
	const {pullId} = useParams<ActorListRouteParams>()

	const pull = report.pulls
		.find(pull => pull.id === pullId)

	const encounter = pull?.encounter

	const title = encounter?.name ?? 'Unknown'
	const subtitle = pull?.duration && `(${formatDuration(pull.duration)})`

	const banner = encounter?.duty.id != null
		? getDutyBanner(encounter.duty.id)
		: undefined

	return <>
		<Breadcrumb title={title} subtitle={subtitle}/>
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

	return <Breadcrumb title={name ?? 'Unknown'}/>
}

interface ReportLinkProps {
	reportStore: ReportStore
}

function ReportLink({reportStore}: ReportLinkProps) {
	const {pullId, actorId} = useParams<ReportLinkRouteParams>()

	const link = reportStore.getReportLink(pullId, actorId)

	if (link == null) {
		return null
	}

	return (
		<ReportLinkContent>
			<a
				href={link.url}
				target="_blank"
				rel="noopener noreferrer"
				className={styles.reportLink}
			>
				{link.icon && (
					<img src={link.icon} alt={link.name} className={styles.icon}/>
				)}
				<Trans id="core.report-flow.view-report">
					View report on {link.name}
				</Trans>
			</a>
		</ReportLinkContent>
	)
}
