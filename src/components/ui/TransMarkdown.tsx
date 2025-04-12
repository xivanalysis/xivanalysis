import {MessageDescriptor} from '@lingui/core'
import {withI18n, withI18nProps} from '@lingui/react'
import ReactMarkdown from 'react-markdown'

export type TransMarkdownProps = {
	source: MessageDescriptor
}

type TransMarkdownImplProps =
	& TransMarkdownProps
	& withI18nProps

function TransMarkdownImpl({i18n, source}: TransMarkdownImplProps) {
	// i18n might not be ready yet, load the default as a fallback
	// ridiculous .replace because lingui is pants on head and escaped the escape characters.
	const finalSource = i18n
		? i18n._(source).replace(/\\`/g, '`')
		: source.defaults || ''

	return <ReactMarkdown	children={finalSource}/>
}

export const TransMarkdown = withI18n()(TransMarkdownImpl)
