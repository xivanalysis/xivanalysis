import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {AoEUsages as CoreAoE} from 'parser/core/modules/AoEUsages'

const GRAVITY_TARGETS: number = 3
const GRAVITY_TARGETS_7_2: number = 2

export class AoEUsages extends CoreAoE {
	override suggestionIcon = this.data.actions.GRAVITY_II.icon

	protected aoeByPatch: number = this.parser.patch.before('7.2') ? GRAVITY_TARGETS : GRAVITY_TARGETS_7_2

	protected override suggestionContent: string | JSX.Element = <Trans id="ast.aoeusages.suggestion.content">
		Avoid using <DataLink action="GRAVITY_II" /> when it does less damage on <Plural value={this.aoeByPatch - 1} one="# target" other="# targets" /> than a <DataLink action="FALL_MALEFIC" />.
		If <DataLink action="GRAVITY_II" /> cannot hit at least <Plural value={this.aoeByPatch} one="# target" other="# targets" />, <DataLink action="FALL_MALEFIC" /> will do more total damage and should be used instead.
		Additionally, consider using <DataLink action="MACROCOSMOS" /> when available without interrupting your healing plan as it is a gain over <DataLink action="GRAVITY_II" showIcon={false} />.
	</Trans>

	trackedActions = [
		{
			aoeAction: this.data.actions.GRAVITY_II,
			stActions: [this.data.actions.FALL_MALEFIC],
			minTargets: this.aoeByPatch,
		},
	]
}
