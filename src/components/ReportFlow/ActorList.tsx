import {Trans} from '@lingui/react'
import {Message, Segment} from 'akkd'
import Color from 'color'
import {JobIcon} from 'components/ui/JobIcon'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {Role, RoleKey, ROLES, JobKey, JOBS} from 'data/JOBS'
import {patchSupported} from 'data/PATCHES'
import {FALLBACK_KEY} from 'data/PATCHES/patches'
import {AVAILABLE_MODULES} from 'parser/AVAILABLE_MODULES'
import {Meta} from 'parser/core/Meta'
import React, {ReactNode} from 'react'
import {useRouteMatch, Link} from 'react-router-dom'
import {Report, Actor, Pull} from 'report'
import {ReportStore} from 'reportSources'
import styles from './ReportFlow.module.css'

interface RoleGroupData {
	role: Role
	actors: Actor[]
}

const UNSUPPORTED_ROLES = [
	ROLES.UNSUPPORTED,
	ROLES.OUTDATED,
]

export interface ActorListProps {
	reportStore: ReportStore
	meta: Meta
	report: Report
	pull: Pull
}

export function ActorList({reportStore, meta, report, pull}: ActorListProps) {
	// Ensure actors are up to date
	reportStore.requestActors(pull.id)

	const actors = pull.actors
		.filter(actor => actor.playerControlled)

	const groups = new Map<RoleKey, RoleGroupData>()
	for (const actor of actors) {
		const role = getJobRole(actor.job, meta, pull, report)

		let group = groups.get(role)
		if (group == null) {
			group = {role: ROLES[role], actors: []}
			groups.set(role, group)
		}

		group.actors.push(actor)
	}

	const sortedGroups = [...groups.values()]
		.sort((a, b) => a.role.id - b.role.id)

	let warningDisplayed = false
	return (
		<div className={styles.actorList}>
			{sortedGroups.map(group => {
				const showWarning = true
					&& !warningDisplayed
					&& UNSUPPORTED_ROLES.includes(group.role)
				if (showWarning) { warningDisplayed = true }

				return (
					<React.Fragment key={group.role.id}>
						{showWarning && <UnsupportedWarning/>}
						<RoleGroup meta={meta} group={group}/>
					</React.Fragment>
				)
			})}
		</div>
	)
}

function getJobRole(
	jobKey: JobKey,
	meta: Meta,
	pull: Pull,
	report: Report,
): RoleKey {
	const jobMeta = AVAILABLE_MODULES.JOBS[jobKey]
	if (jobMeta?.supportedPatches == null) { return 'UNSUPPORTED' }

	// Realistically this will never use the fallback, but let's be super sure.
	const supportedPatches = meta.merge(jobMeta).supportedPatches
		?? {from: FALLBACK_KEY, to: FALLBACK_KEY}
	const {from, to = from} = supportedPatches

	return patchSupported(report.edition, from, to, pull.timestamp / 1000)
		? JOBS[jobKey].role
		: 'OUTDATED'
}

const UnsupportedWarning = () => (
	<Segment><Message info icon="code">
		<Message.Header><Trans id="core.report-flow.job-unsupported.title" render="strong">Favourite job unsupported?</Trans></Message.Header>
		<Trans id="core.report-flow.job-unsupported.description">We're always looking to expand our support and accuracy. Come drop by our Discord channel and see how you could help out!</Trans>
	</Message></Segment>
)

interface RoleGroupProps {
	meta: Meta
	group: RoleGroupData
}

function RoleGroup({meta, group: {role, actors}}: RoleGroupProps) {
	/* eslint-disable @typescript-eslint/no-magic-numbers */
	const background = role.colour.background
	const color = role.colour.text
	/* eslint-enable @typescript-eslint/no-magic-numbers */

	return (
		<div className={styles.group}>
			<h2 style={{background, color}}>
				<NormalisedMessage message={role.name}/>
			</h2>

			<div className={styles.links}>
				{actors.map(actor => <ActorLink key={actor.id} meta={meta} actor={actor}/>)}
			</div>
		</div>
	)
}

interface ActorLinkProps {
	meta: Meta
	actor: Actor
}

function ActorLink({meta: baseMeta, actor}: ActorLinkProps) {
	const {url} = useRouteMatch()

	const job = JOBS[actor.job]
	const jobMeta = AVAILABLE_MODULES.JOBS[actor.job]

	// We avoid merging core if there's no supported patch so we don't end up
	// showing core's support range on unsupported jobs.
	let meta = jobMeta
	if (jobMeta?.supportedPatches != null) {
		meta = baseMeta.merge(jobMeta)
	}

	let supportedPatches: ReactNode
	if (meta?.supportedPatches != null) {
		const {from, to = from} = meta.supportedPatches
		supportedPatches = (
			<Trans id="core.report-flow.supported-patches">
				Patch {from}{from !== to ? `-${to}` : ''}
			</Trans>
		)
	}

	return (
		<Link key={actor.id} to={`${url}/${actor.id}`} className={styles.link}>
			<span className={styles.text}>
				<JobIcon job={job}/>
				{actor.name}
			</span>

			{supportedPatches && (
				<span className={styles.meta}>
					{supportedPatches}
				</span>
			)}
		</Link>
	)
}
