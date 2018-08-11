import Color from 'color'
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import {Label} from 'semantic-ui-react'

export default class ContributorLabel extends PureComponent {
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

	render() {
		const {contributor, detail} = this.props

		const name = typeof contributor === 'string'? contributor : contributor.name

		const style = {}
		if (contributor.jobs && contributor.jobs.length) {
			// I'm assuming the first job they list is their 'main'
			const job = contributor.jobs[0]
			style.backgroundColor = job.colour
			const colour = Color(job.colour)
			if (colour.isDark()) {
				style.color = 'white'
			}
		}

		return <Label
			image
			style={style}
		>
			{contributor.avatar && <img src={contributor.avatar} alt={name}/>}
			{name}
			{detail && <Label.Detail>{detail}</Label.Detail>}
		</Label>
	}
}
