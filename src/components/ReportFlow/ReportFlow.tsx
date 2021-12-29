import {Trans} from '@lingui/react'
import {Message} from 'akkd'
import classNames from 'classnames'
import {BranchBanner} from 'components/BranchBanner'
import {DataContextProvider} from 'components/DataContext'
import {BreadcrumbsBanner, Breadcrumb, ReportLinkContent} from 'components/GlobalSidebar'
import {GameEdition} from 'data/EDITIONS'
import {getDutyBanner} from 'data/ENCOUNTERS'
import {getPatch, Patch} from 'data/PATCHES'
import React, {ReactNode, useCallback, useMemo} from 'react'
import {Switch, useRouteMatch, Route, useParams} from 'react-router-dom'
import {Actor, Pull, Report} from 'report'
import {ReportStore} from 'reportSources'
import {Icon} from 'semantic-ui-react'
import {formatDuration} from 'utilities'
import {ActorList} from './ActorList'
import {Analyse} from './Analyse'
import {PullList} from './PullList'
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

const editionName = {
	[GameEdition.GLOBAL]: <Icon name="globe"/>,
	[GameEdition.KOREAN]: 'KR',
	[GameEdition.CHINESE]: 'CN',
}

export interface ReportFlowProps {
	reportStore: ReportStore
}

/**
 * Generic report flow component, to be nested inside a report source providing
 * source-specific report handling. Parent report sources must provide a report
 * store for consumption by the flow.
 */
export function ReportFlow({reportStore}: ReportFlowProps) {
	const {path, url} = useRouteMatch()
	const {report} = reportStore

	// This is intentionally quite generic. If a specific report source can provide
	// more information, it should do so in the report source itself.
	if (report == null) {
		return (
			<Message error icon="times circle outline">
				<Trans id="core.report-flow.report-not-found">
					<Message.Header>Report not found.</Message.Header>
					No report data was found for "{url}".
				</Trans>
			</Message>
		)
	}

	return (
		<DataProvider report={report}>
			<BranchBanner report={report}/>

			<Route path={`${path}/:pullId?/:actorId?`}>
				<ReportLink reportStore={reportStore}/>
			</Route>

			<Breadcrumb
				title={report.name}
				subtitle={<>
					(
					{editionName[report.edition]}
					{getPatch(report.edition, report.timestamp / 1000)}
					)
				</>}
			/>

			<Switch>
				<Route path={`${path}/:pullId`}>
					<ActorListRoute
						reportStore={reportStore}
						report={report}
					/>
				</Route>
				<Route path={path}>
					<PullList reportStore={reportStore}/>
				</Route>
			</Switch>
		</DataProvider>
	)
}

interface DataProviderProps {
	children?: ReactNode
	report: Report
}

function DataProvider({children, report}:DataProviderProps) {
	const patch = useMemo(
		() => new Patch(report.edition, report.timestamp),
		[report],
	)

	return (
		<DataContextProvider patch={patch}>
			{children}
		</DataContextProvider>
	)
}

interface ActorListRouteProps {
	reportStore: ReportStore
	report: Report
}

interface ActorListRouteParams {
	pullId: Pull['id']
}

function ActorListRoute({reportStore, report}: ActorListRouteProps) {
	const {path} = useRouteMatch()
	const {pullId} = useParams<ActorListRouteParams>()

	const onRefreshPulls = useCallback(
		() => reportStore.requestPulls({bypassCache: true}),
		[reportStore],
	)

	const pull = report.pulls.find(pull => pull.id === pullId)
	if (pull == null) {
		return (
			<Message warning icon="warning sign">
				<Trans id="core.report-flow.pull-not-found">
					<Message.Header>Pull not found.</Message.Header>
					No pull was found with ID "{pullId}". If this report has been updated recently, it may have been cached - try pressing Refresh to retrieve the latest data.
				</Trans>

				<button
					className={classNames(styles.refresh, styles.block)}
					onClick={onRefreshPulls}
				>
					<Icon name="refresh"/>
					<Trans id="core.report-flow.refresh">Refresh</Trans>
				</button>
			</Message>
		)
	}

	return <>
		<Breadcrumb
			title={pull.encounter.name}
			subtitle={`(${formatDuration(pull.duration)})`}
		/>
		<BreadcrumbsBanner banner={getDutyBanner(pull.encounter.duty.id)}/>

		<Switch>
			<Route path={`${path}/:actorId`}>
				<AnalyseRoute reportStore={reportStore} report={report} pull={pull}/>
			</Route>
			<Route path={path}>
				<ActorList reportStore={reportStore} report={report} pull={pull}/>
			</Route>
		</Switch>
	</>
}

interface AnalyseRouteProps {
	reportStore: ReportStore
	report: Report
	pull: Pull
}

interface AnalyseRouteParams {
	actorId: Actor['id']
}

function AnalyseRoute({reportStore, report, pull}: AnalyseRouteProps) {
	const {actorId} = useParams<AnalyseRouteParams>()
	const actor = pull.actors.find(actor => actor.id === actorId)

	const onRefreshActors = useCallback(
		() => reportStore.requestActors(pull.id, {bypassCache: true}),
		[reportStore, pull],
	)

	if (actor == null) {
		return (
			<Message warning icon="warning sign">
				<Trans id="core.report-flow.actor-not-found">
					<Message.Header>Actor not found.</Message.Header>
					No actor was found with ID "{actorId}". If this report has been updated recently, it may have been cached - try pressing Refresh to retrieve the latest data.
				</Trans>

				<button
					className={classNames(styles.refresh, styles.block)}
					onClick={onRefreshActors}
				>
					<Icon name="refresh"/>
					<Trans id="core.report-flow.refresh">Refresh</Trans>
				</button>
			</Message>
		)
	}

	return <>
		<Breadcrumb title={actor.name}/>

		<Analyse
			reportStore={reportStore}
			report={report}
			pull={pull}
			actor={actor}
		/>
	</>
}
interface ReportLinkProps {
	reportStore: ReportStore
}

interface ReportLinkRouteParams {
	pullId?: Pull['id']
	actorId?: Actor['id']
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
