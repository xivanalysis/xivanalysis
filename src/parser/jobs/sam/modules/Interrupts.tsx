import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {ACTIONS} from 'data/ACTIONS'
import {Interrupts as CoreInterrupts} from 'parser/core/modules/Interrupts'

export class Interrupts extends CoreInterrupts {
	override suggestionContent = <Trans id="sam.interrupts.suggestion.content">
		Avoid interrupting <ActionLink {...ACTIONS.IAIJUTSU}/> casts. Despite the short cast time, moving too early can interrupt the skill causing you to have to waste time re-casting it.
	</Trans>
}
