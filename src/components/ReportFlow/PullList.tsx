import React from 'react'
import {Duty, Pull} from 'report'
import {Link, useRouteMatch} from 'react-router-dom'
import {ReportStore} from 'store/new/report'
import styles from './PullList.module.css'
import {getZoneBanner} from 'data/BOSSES'

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
	return (
		<div className={styles.group}>
			<div className={styles.groupHeader}>
				<div
					className={styles.banner}
					style={{backgroundImage: `url(${getZoneBanner(group.duty.id)})`}}
				/>
				<h2>{group.duty.name}</h2>
			</div>

			{group.pulls.map(pull => (
				<Link
					key={pull.id}
					to={`${url}/${pull.id}`}
					className={styles.link}
				>
					{pull.encounter.name}
				</Link>
			))}
		</div>
	)
}
