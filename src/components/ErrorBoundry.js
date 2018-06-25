import PropTypes from 'prop-types'
import Raven from 'raven-js'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Container, Message} from 'semantic-ui-react'

import * as Errors from 'errors'

// Error type render config
const ERROR_PROPS = {
	[Errors.SEVERITY.ERROR]: {
		error: true,
		icon: 'times circle outline',
	},
	[Errors.SEVERITY.WARNING]: {
		warning: true,
		icon: 'warning sign',
	},
}


// Main component
class ErrorBoundry extends Component {
	static propTypes = {
		children: PropTypes.node,
		globalError: PropTypes.instanceOf(Errors.GlobalError),
	}

	constructor(props) {
		super(props)

		this.state = {
			componentError: null,
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
				{...(ERROR_PROPS[error.severity || Errors.SEVERITY.ERROR])}
				header={error.message || error.toString()}
				content={<p>
					{error.detail || 'Looks like something has gone wrong. The code monkies have been notified.'}
				</p>}
			/>
		</Container>
	}
}

const mapStateToProps = state => ({
	globalError: state.globalError,
})

export default connect(mapStateToProps)(ErrorBoundry)
