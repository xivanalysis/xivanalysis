import {Trans} from '@lingui/react'
import * as Sentry from '@sentry/browser'
import classNames from 'classnames'
import {action, observable} from 'mobx'
import {observer} from 'mobx-react'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Container, Header, Icon} from 'semantic-ui-react'
import {StoreContext} from 'store'
import ErrorMessage from './ui/ErrorMessage'
import styles from './ErrorBoundary.module.css'
import {NotFoundError} from 'errors'

@observer
class ErrorBoundary extends Component {
	static propTypes = {
		children: PropTypes.node,
	}

	static contextType = StoreContext

	refreshFights = () => {
		const {reportStore} = this.context
		reportStore.refreshReport()
	}

	renderRefreshButton = (error) => {
		if (!(error instanceof NotFoundError)) {
			return ''
		}

		return <Header>
			<div className={classNames(styles.refreshHeader, 'pull-right')}>
				<span className={styles.refresh} onClick={this.refreshFights}>
					<Icon name="refresh"/>
					<Trans id="core.find.refresh">
					Refresh
					</Trans>
				</span>
			</div>
		</Header>
	}

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
				{this.renderRefreshButton(error)}
				<ErrorMessage error={error}/>
			</Container>
		)
	}
}

export default ErrorBoundary
