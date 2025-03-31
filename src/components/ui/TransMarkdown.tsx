import {MessageDescriptor} from '@lingui/core'
import {useLingui} from '@lingui/react/macro'
import ReactMarkdown from 'react-markdown'

export type TransMarkdownProps = {
	source: MessageDescriptor
}

export function TransMarkdown({source}: TransMarkdownProps) {
	const {i18n} = useLingui()

	// i18n might not be ready yet, load the default as a fallback
	// ridiculous .replace because lingui is pants on head and escaped the escape characters.
	const finalSource = i18n
		? i18n._(source).replace(/\\`/g, '`')
		: source.message || ''

	return <ReactMarkdown	children={finalSource}/>
}
