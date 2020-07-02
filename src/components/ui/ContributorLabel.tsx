import Color from 'color'
import {Contributor} from 'data/CONTRIBUTORS'
import PropTypes from 'prop-types'
import React, {CSSProperties, PureComponent} from 'react'
import {Label} from 'semantic-ui-react'

interface ContributorLabelProps {
	contributor: string | Contributor
	detail?: React.ReactNode
}

export default class ContributorLabel extends PureComponent<ContributorLabelProps> {
	static propTypes = {
		contributor: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.shape({
				name: PropTypes.string.isRequired,
				avatar: PropTypes.string,
			}),
		]).isRequired,
		detail: PropTypes.node,
	}

	normalizeContributor = (contributor: string | Contributor): Contributor => {
		if (typeof contributor === 'string') {
			return {
				name: contributor,
				jobs: [],
			}
		} else {
			return contributor
		}
	}

	render() {
		const {contributor, detail} = this.props

		const {avatar, name, jobs} = this.normalizeContributor(contributor)

		const style: CSSProperties = {}
		if (jobs && jobs.length) {
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
