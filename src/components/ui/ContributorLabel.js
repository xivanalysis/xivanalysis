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
		detail: PropTypes.string,
	}

	render() {
		const {contributor, detail} = this.props

		const name = typeof contributor === 'string'? contributor : contributor.name
		return <Label
			image
		>
			{contributor.avatar && <img src={contributor.avatar} alt={name}/>}
			{name}
			{detail && <Label.Detail>{detail}</Label.Detail>}
		</Label>
	}
}
