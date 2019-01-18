import {observable, action} from 'mobx'
import {inject, observer} from 'mobx-react'
import PropTypes from 'prop-types'
import Raven from 'raven-js'
import React, {Component} from 'react'
import {Container} from 'semantic-ui-react'

import {GlobalErrorStore} from 'store/globalError'
import ErrorMessage from './ui/ErrorMessage'

@inject('globalErrorStore')
@observer
class ErrorBoundary extends Component {
	static propTypes = {
		globalErrorStore: PropTypes.instanceOf(GlobalErrorStore),
		children: PropTypes.node,
	}

	@observable componentError

	@action
	componentDidCatch(error, errorInfo) {
		this.componentError = error
		Raven.captureException(error, {extra: errorInfo})
	}

	render() {
		const error = this.props.globalErrorStore.error || this.componentError

		if (!error) {
			return this.props.children
		}

		return <Container style={{marginTop: '1em'}}>
			<ErrorMessage error={error}/>
		</Container>
	}
}

export default ErrorBoundary
