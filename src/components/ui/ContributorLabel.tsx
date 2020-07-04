import Color from 'color'
import {Contributor} from 'data/CONTRIBUTORS'
import React, {CSSProperties, PureComponent, ReactNode} from 'react'
import {Label} from 'semantic-ui-react'

interface ContributorLabelProps {
	contributor: Contributor
	detail?: ReactNode
}

export default class ContributorLabel extends PureComponent<ContributorLabelProps> {
	render() {
		const {contributor, detail} = this.props

		const {avatar, name, jobs} = contributor

		const style: CSSProperties = {}
		if (jobs.length) {
			// I'm assuming the first job they list is their 'main'
			const job = jobs[0]
			style.backgroundColor = job.colour
			if (Color(job.colour).isDark()) {
				style.color = 'white'
			}
		}

		return <Label
			image
			style={style}
		>
			{avatar && <img src={avatar} alt={name}/>}
			{name}
			{detail && <Label.Detail>{detail}</Label.Detail>}
		</Label>
	}
}
