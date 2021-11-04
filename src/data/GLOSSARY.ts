import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {ensureRecord} from 'utilities'

interface GlossaryEntry {
	text: MessageDescriptor,
	description: MessageDescriptor,
}

export const TERMS = ensureRecord<GlossaryEntry>()({
	PROC: {
		text: t('glossary.proc.title')`proc`,
		description: t('glossary.proc.description')`Proc is a term used in gaming to refer to an event (a "procedure") that is triggered under certain circumstances.

For example, [~action/VERTHUNDER] has a 50% chance of triggering the status [~status/VERFIRE_READY] when cast.`,
	},
})
