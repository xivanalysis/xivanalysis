import {Trans} from '@lingui/react'
import {BaseError, Severity, SEVERITY} from 'errors'
import {Message, MessageProps} from 'semantic-ui-react'

// Error type render config
const ERROR_PROPS: Record<Severity, Partial<MessageProps>> = {
	[SEVERITY.ERROR]: {
		error: true,
		icon: 'times circle outline',
	},
	[SEVERITY.WARNING]: {
		warning: true,
		icon: 'warning sign',
	},
}

export type ErrorMessageProps = {
	error: Error & Partial<BaseError>
}

export function ErrorMessage({error}: ErrorMessageProps) {
	return (
		<Message
			{...(ERROR_PROPS[error.severity || SEVERITY.ERROR])}
			header={error.message || error.toString()}
			content={<p>
				{error.detail || (
					<Trans id="core.error.unknown">xivanalysis encountered an unknown error. If this issue persists, let us know on Discord.</Trans>
				)}
				{error.inner && <pre>{error.inner.toString()}</pre>}
			</p>}
		/>
	)
}
