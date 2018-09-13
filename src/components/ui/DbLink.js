import {Trans} from '@lingui/react'
import {
	Provider as TooltipProvider,
	tooltipHOC,
} from '@xivanalysis/tooltips'
import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'
import {Popup, Icon} from 'semantic-ui-react'

import {STATUS_ID_OFFSET} from 'data/STATUSES'

import styles from './DbLink.module.css'

// Wrapping the provider w/ connect to pick up lang changes
export const Provider = connect(state => ({
	language: state.language.site,
}))(({language, children}) => {
	console.log('state', language)
	return <TooltipProvider language={language}>
		{children}
	</TooltipProvider>
})

class TooltipBase extends React.PureComponent {
	static propTypes = {
		baseUrl: PropTypes.string,
		loading: PropTypes.bool.isRequired,
		data: PropTypes.object,
		Content: PropTypes.node,
	}

	render() {
		// Pull in data from props and state
		const {
			baseUrl,
			loading,
			data,
			Content,
		} = this.props

		const showIcon = true
		const children = null
		const showTooltip = true

		if (loading) {
			return <span>
				{showIcon && <Icon loading name="circle notch" />}
				{children || <Trans id="core.dblink.loading">Loading...</Trans>}
			</span>
		}

		const link = <span className={styles.link}>
			{showIcon && <img src={baseUrl + data.icon} alt="" />}
			{children || data.name}
		</span>

		if (!showTooltip) {
			return link
		}

		return <Popup
			basic
			style={{padding: '0px'}}
			trigger={link}
			content={<Content/>}
		/>
	}
}

const Tooltip = tooltipHOC(TooltipBase)

export default Tooltip

// Helpers, because ack is lazy. AND PROUD OF IT.
export const ActionLink = props => <Tooltip type="Action" {...props} />
export const StatusLink = props => <Tooltip
	type="Status"
	{...props}
	id={props.id - STATUS_ID_OFFSET}
/>

StatusLink.propTypes = {
	id: PropTypes.number.isRequired,
}
