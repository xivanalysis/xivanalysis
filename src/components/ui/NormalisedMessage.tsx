import {MessageDescriptor} from '@lingui/core'
import {useLingui} from '@lingui/react/macro'

interface Props {
	message: MessageDescriptor
}

export function NormalisedMessage({message}: Props) {
	const {i18n} = useLingui()
	return <>{i18n._(message)}</>
}
