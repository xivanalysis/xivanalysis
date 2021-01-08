import {Trans} from '@lingui/react'
import {SEVERITY} from 'errors'
import * as PropTypes from 'prop-types'
import React from 'react'
import {Message} from 'semantic-ui-react'

// Error type render config
const ERROR_PROPS = {
	[SEVERITY.ERROR]: {
		error: true,
		icon: 'times circle outline',
	},
	[SEVERITY.WARNING]: {
		warning: true,
		icon: 'warning sign',
	},
}

const ErrorMessage = ({error}) => <Message
	{...(ERROR_PROPS[error.severity || SEVERITY.ERROR])}
	header={error.message || error.toString()}
	content={<p>
		{error.detail || <Trans id="core.error.generic">Looks like something has gone wrong. The code monkies have been notified.</Trans>}
	</p>}
/>

ErrorMessage.propTypes = {
	error: PropTypes.shape({
		severity: PropTypes.oneOf(Object.values(SEVERITY)),
		message: PropTypes.string,
		detail: PropTypes.string,
	}).isRequired,
}

export default ErrorMessage
