import {I18n, MessageDescriptor} from '@lingui/core'
import {withI18n} from '@lingui/react'

interface Props {
	i18n: I18n
	message: MessageDescriptor
}

function NormalisedMessageImpl({message, i18n}: Props) {
	return <>{i18n._(message)}</>
}

export const NormalisedMessage = withI18n()(NormalisedMessageImpl)
