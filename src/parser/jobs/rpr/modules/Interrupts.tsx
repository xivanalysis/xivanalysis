import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {Interrupts as CoreInterrupts} from 'parser/core/modules/AlwaysBeCasting/Interrupts'

export class Interrupts extends CoreInterrupts {
	override suggestionContent = <Trans id="rpr.interrupts.suggestion.content">
		Avoid interrupting casts by either pre-positioning yourself or slidecasting where possible.
		If you need to move, consider using <DataLink action="HELLS_INGRESS"/> or <DataLink action="HELLS_EGRESS"/>
		and using <DataLink status="ENHANCED_HARPE"/> to instant cast <DataLink action="HARPE"/> to keep your GCD rolling.
	</Trans>
}
