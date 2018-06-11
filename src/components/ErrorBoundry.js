import ExtendableError from 'es6-error'
import PropTypes from 'prop-types'
import Raven from 'raven-js'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Message } from 'semantic-ui-react'

// Global error types
export class GlobalError extends ExtendableError {}
export class LogNotFoundError extends GlobalError {}

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
				error
				icon="times circle outline"
				header="Ah, shit."
				content={<p>
					Looks like something has gone wrong. The code monkies have been notified.<br/>
					<code>{error.toString()}</code>
				</p>}
			/>
		</Container>
	}
}

const mapStateToProps = state => ({
	globalError: state.globalError
})

export default connect(mapStateToProps)(ErrorBoundry)
