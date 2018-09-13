import {
	Provider as TooltipProvider,
	Tooltip,
} from '@xivanalysis/tooltips'
import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'

import {STATUS_ID_OFFSET} from 'data/STATUSES'

// Wrapping the provider w/ connect to pick up lang changes
export const Provider = connect(state => ({
	language: state.language.site,
}))(({language, children}) => {
	console.log('state', language)
	return <TooltipProvider language={language}>
		{children}
	</TooltipProvider>
})

// Re-exporting the tooltip by default to maintain the interface
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
