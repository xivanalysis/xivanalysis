import * as Sentry from '@sentry/browser'
import {action, observable} from 'mobx'
import {observer} from 'mobx-react'
import * as PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Container} from 'semantic-ui-react'
import {StoreContext} from 'store'
import ErrorMessage from './ui/ErrorMessage'

@observer
class ErrorBoundary extends Component {
	static propTypes = {
		children: PropTypes.node,
	}

	static contextType = StoreContext

	@observable componentError

	@action
	componentDidCatch(error, errorInfo) {
		this.componentError = error
		Sentry.withScope(scope => {
			scope.setExtras(errorInfo)
			Sentry.captureException(error)
		})
	}

	render() {
		const error = this.context.globalErrorStore.error || this.componentError

		if (!error) {
			return this.props.children
		}

		return (
			<Container style={{marginTop: '1em'}}>
				<ErrorMessage error={error}/>
			</Container>
		)
	}
}

export default ErrorBoundary
