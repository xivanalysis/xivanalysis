import {Job} from 'data/JOBS'
import React from 'react'
import styles from './JobIcon.module.css'

interface Props {
	job: Job,
	scale?: number,
}

export default class JobIcon extends React.PureComponent<Props> {
	render() {
		const {
			job: {icon},
			scale = 2,
		} = this.props

		return (
			<span
				className={styles.icon}
				style={{fontSize: `${scale}em`}}
			>
				{icon}
			</span>
		)
	}
}
