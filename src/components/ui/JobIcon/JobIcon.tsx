import {Job} from 'data/JOBS'
import React from 'react'
import styles from './JobIcon.module.css'

export interface JobIconProps {
	job: Job,
	scale?: number,
}

export function JobIcon({job: {icon}, scale=2}: JobIconProps) {
	return (
		<span
			className={styles.icon}
			style={{fontSize: `${scale}em`}}
		>
			{icon}
		</span>
	)
}
