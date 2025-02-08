import * as Sentry from '@sentry/browser'
import {action, observable} from 'mobx'
import {observer} from 'mobx-react'
import {Component, ContextType, ErrorInfo, ReactNode} from 'react'
import {Container} from 'semantic-ui-react'
import {StoreContext} from 'store'
import {ErrorMessage} from './ui/ErrorMessage'

export type ErrorBoundaryProps = {
	children?: ReactNode
}

@observer
export class ErrorBoundary extends Component<ErrorBoundaryProps> {
	static override contextType = StoreContext
	declare context: ContextType<typeof StoreContext>

	@observable componentError: Error | undefined

	@action
	override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.componentError = error
		Sentry.withScope(scope => {
			scope.setExtras({...errorInfo})
			Sentry.captureException(error)
		})
	}

	override render() {
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
