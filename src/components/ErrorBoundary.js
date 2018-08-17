import PropTypes from 'prop-types'
import Raven from 'raven-js'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Container} from 'semantic-ui-react'

import {GlobalError} from 'errors'
import ErrorMessage from './ui/ErrorMessage'

// Main component
class ErrorBoundary extends Component {
	static propTypes = {
		children: PropTypes.node,
		globalError: PropTypes.instanceOf(GlobalError),
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

		return <Container style={{marginTop: '1em'}}>
			<ErrorMessage error={error}/>
		</Container>
	}
}

const mapStateToProps = state => ({
	globalError: state.globalError,
})

export default connect(mapStateToProps)(ErrorBoundary)
