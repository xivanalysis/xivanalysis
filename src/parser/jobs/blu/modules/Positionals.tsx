import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {Positionals as CorePositionals} from 'parser/core/modules/Positionals'

export class Positionals extends CorePositionals {
	positionals = [
		this.data.actions.GOBLIN_PUNCH,
	]

	override missedPositionalsChecklistDescription(): JSX.Element {
		return <Trans id="blu.positionals.checklist.description">
			<DataLink action="GOBLIN_PUNCH" showIcon={false} /> is a front positional.  For BLU tanks, missing the positional is damage neutral compared to our filler, but you should still aim to use it from the front to do the most damage.
		</Trans>
	}
}
