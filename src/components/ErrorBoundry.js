import PropTypes from 'prop-types'
import Raven from 'raven-js'
import React, { Component } from 'react'
import { Container, Message } from 'semantic-ui-react'

class ErrorBoundry extends Component {
	static propTypes = {
		children: PropTypes.node
	}

	constructor(props) {
		super(props)

		this.state = {
			error: null
		}
	}

	componentDidCatch(error, errorInfo) {
		this.setState({error})
		Raven.captureException(error, {extra: errorInfo})
	}

	render() {
		if (!this.state.error) {
			return this.props.children
		}

		return <Container>
			<Message
				error
				icon="times circle outline"
				header="Ah, shit."
				content={<p>
					Looks like something has gone wrong. The code monkies have been notified.<br/>
					<code>{this.state.error.toString()}</code>
				</p>}
			/>
		</Container>
	}
}

export default ErrorBoundry
