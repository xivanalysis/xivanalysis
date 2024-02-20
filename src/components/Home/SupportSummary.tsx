import {Trans} from '@lingui/react'
import {JobIcon} from 'components/ui/JobIcon'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {GameEdition} from 'data/EDITIONS'
import {JobKey, JOBS, RoleKey, ROLES} from 'data/JOBS'
import {patchSupported} from 'data/PATCHES'
import {FALLBACK_KEY, PATCHES} from 'data/PATCHES/patches'
import {AVAILABLE_MODULES} from 'parser/AVAILABLE_MODULES'
import React, {Component, Fragment} from 'react'
import {Message} from 'semantic-ui-react'
import styles from './SupportSummary.module.css'

interface RoleData {
	roleKey: RoleKey
	jobKeys: JobKey[]
}

class SupportSummary extends Component {
	override render() {
		const maxPatch = Object.entries(PATCHES)
			.map(patch => ({name: patch[0], date: patch[1].date[GameEdition.GLOBAL]}))
			.sort((a, b) => b.date - a.date)[0].name
		const coreMeta = AVAILABLE_MODULES.CORE
		const coreTo = coreMeta.supportedPatches?.to ?? FALLBACK_KEY

		if (coreTo === FALLBACK_KEY) {
			return <Message error>
				<Message.Header>
					<Trans id="core.support-summary.fallback-header">xivanalysis does not support this expansion yet.</Trans>
				</Message.Header>
				<Message.Content>
					<Trans id="core.support-summary.fallback-message">Please check back later.</Trans>
				</Message.Content>
			</Message>
		}

		let supportMessage
		if (coreTo === maxPatch) {
			supportMessage = <Message>
				<Trans id="core.support-summary.core-supported">xivanalysis supports up to patch {coreTo}</Trans>
			</Message>
		} else {
			supportMessage = <Message warning>
				<Trans id="core.support-summary.core-outdated">xivanalysis supports up to patch {coreTo} of {maxPatch}</Trans>
			</Message>
		}

		// Build the list of roles and their associated jobs
		let jobKey: JobKey
		const roleJobs: RoleData[] = []
		for (jobKey in JOBS) {
			const roleKey = JOBS[jobKey].role
			if (roleKey === 'UNSUPPORTED') { continue }
			const roleData = roleJobs.find(rd => rd.roleKey === roleKey) ?? {roleKey, jobKeys: []}
			roleData.jobKeys.push(jobKey)
			if (!roleJobs.some(rd => rd.roleKey === roleKey)) {
				roleJobs.push(roleData)
			}
		}

		return <>
			{supportMessage}
			<div className={styles.summary}>
				<SupportSummaryGrid roles={roleJobs} />
			</div>
		</>
	}

}

export default SupportSummary

interface SupportSummaryGridProp {
	roles: RoleData[]
}

interface SupportSummaryGridRoleProp {
	role: RoleData
}

interface SupportSummaryJobTileProp {
	jobKey: JobKey
}

export class SupportSummaryGrid extends React.Component<SupportSummaryGridProp> {

	static JobTile = ({jobKey}: SupportSummaryJobTileProp) => {
		const meta = AVAILABLE_MODULES.JOBS[jobKey]

		// This shouldn't ever happen but hey
		if (meta == null) {
			return <div className={styles.job + ' ' + styles.unknown}>
				<NormalisedMessage message={JOBS.UNKNOWN.name} />
			</div>
		}

		// If there are no supported patches, just show as unsupported
		let supportMessage = <NormalisedMessage message={ROLES.UNSUPPORTED.name} />
		let supported: boolean | undefined = undefined
		let style = styles.unsupported
		if (meta.supportedPatches != null) {
			// Figure out what patches are supported right now. Jobs can't go further than core though
			const supportedPatches = AVAILABLE_MODULES.CORE.merge(meta).supportedPatches
				?? {from: FALLBACK_KEY, to: FALLBACK_KEY}
			const {from, to = from} = supportedPatches
			supportMessage = <>{from}{from !== to ? `-${to}` : ''}</>

			supported = patchSupported(GameEdition.GLOBAL, from, to)
			style = supported ? styles.supported : styles.outdated
		}
		// Return back the cell
		return <div className={styles.job + ' ' + style}>
			<JobIcon job={JOBS[jobKey]} />
			{supportMessage}
		</div>
	}

	static RoleHeader = ({role}: SupportSummaryGridRoleProp) =>
		<h4 className={styles.header} style={{borderColor: ROLES[role.roleKey].colour}}/>

	static RoleJobs = ({role}: SupportSummaryGridRoleProp) =>
		<div className={styles.jobs}>
			{
				role.jobKeys.map(jobKey =>
					<SupportSummaryGrid.JobTile key={jobKey} jobKey={jobKey} />
				)
			}
		</div>

	override render(): React.ReactNode {
		const {roles} = this.props

		return <div className={styles.supportGrid}>
			{
				roles.map(role =>
					<Fragment key={role.roleKey}>
						<SupportSummaryGrid.RoleHeader role={role} />
						<SupportSummaryGrid.RoleJobs role={role} />
					</Fragment>
				)
			}
		</div>
	}
}
