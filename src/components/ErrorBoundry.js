import ExtendableError from 'es6-error'
import PropTypes from 'prop-types'
import Raven from 'raven-js'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Message } from 'semantic-ui-react'

// Error type render config
const ERROR_TYPES = {
	ERROR: {
		error: true,
		icon: 'times circle outline'
	},
	WARNING: {
		warning: true,
		icon: 'warning sign'
	}
}

// Global error types
// TODO: Should I care about not being able to override the message?
export class GlobalError extends ExtendableError {
	type = ERROR_TYPES.ERROR
}
export class LogNotFoundError extends GlobalError {
	type = ERROR_TYPES.WARNING
	message = 'Report not found.'
	detail = 'The report specified either does not exist, or is private. Make sure you pasted the correct URL, and your log is either public or unlisted.'
}

// Main component
class ErrorBoundry extends Component {
	static propTypes = {
		children: PropTypes.node,
		globalError: PropTypes.instanceOf(GlobalError)
	}

	constructor(props) {
		super(props)

		this.state = {
			componentError: null
		}
	}

	componentDidCatch(error, errorInfo) {
		this.setState({componentError: error})
		Raven.captureException(error, {extra: errorInfo})
	}

	render() {
		const error = this.props.globalError || this.state.componentError

		if (!error) {
			return this.props.children
		}

		return <Container>
			<Message
				{...(error.type || ERROR_TYPES.ERROR)}
				header={error.message || error.toString()}
				content={<p>
					{error.detail || 'Looks like something has gone wrong. The code monkies have been notified.'}
				</p>}
			/>
		</Container>
	}
}

const mapStateToProps = state => ({
	globalError: state.globalError
})

export default connect(mapStateToProps)(ErrorBoundry)
