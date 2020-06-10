import React from 'react'
import {Duty, Pull} from 'report'
import {Link, useRouteMatch} from 'react-router-dom'
import {ReportStore} from 'store/new/report'
import styles from './PullList.module.css'
import {getZoneBanner, TRASH_ZONE_ID} from 'data/BOSSES'
import {formatDuration} from 'utilities'
import classNames from 'classnames'

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

	let trashPulls: PullGroupData | undefined

	for (const pull of reportStore.report.pulls) {
		const {duty} = pull.encounter

		// TODO: Work out how to model "trash" pulls, to seperate this further
		// from the fflogs-source-specific logic of eld.
		if (duty.id === TRASH_ZONE_ID) {
			if (trashPulls == null) {
				trashPulls = {duty, pulls: []}
			}
			trashPulls.pulls.push(pull)
			continue
		}

		if (duty.id !== currentDuty) {
			groups.push({duty, pulls: []})
			currentDuty = duty.id
		}

		groups[groups.length - 1].pulls.push(pull)
	}

	if (trashPulls != null) {
		groups.push(trashPulls)
	}

	return <>{groups.map(group => <PullGroup group={group}/>)}</>
}

interface PullGroupProps {
	group: PullGroupData
}

const PullGroup = ({group}: PullGroupProps) => (
	<div className={styles.group}>
		<div className={styles.groupHeader}>
			<div
				className={styles.banner}
				style={{backgroundImage: `url(${getZoneBanner(group.duty.id)})`}}
			/>
			<h2>{group.duty.name}</h2>
		</div>

		<div className={styles.links}>
			{group.pulls.map(pull => <PullLink pull={pull}/>)}
		</div>
	</div>
)

interface PullLinkProps {
	pull: Pull
}

function PullLink({pull}: PullLinkProps) {
	const {url} = useRouteMatch()

	return (
		<Link
			key={pull.id}
			to={`${url}/${pull.id}`}
			className={styles.link}
		>
			<span className={styles.text}>
				{pull.encounter.name}
			</span>

			<span className={styles.duration}>
				{formatDuration(pull.duration)}
			</span>

			{pull.progress != null && (
				<div className={styles.progress}>
					<div
						className={classNames(
							styles.progressBar,
							pull.progress >= 100 && styles.success,
						)}
						style={{width: `${pull.progress}%`}}
					/>
				</div>
			)}
		</Link>
	)
}
