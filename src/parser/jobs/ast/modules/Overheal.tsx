import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Overheal as CoreOverheal, SuggestedColors, TrackedOverheal} from 'parser/core/modules/Overheal'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class Overheal extends CoreOverheal {
	static override handle = 'overheal'

	protected override checklistRuleBreakout = true
	protected override displayPieChart = true
	protected override displaySuggestion = true
	protected override displayOrder = DISPLAY_ORDER.OVERHEAL_CHECKLIST

	protected content = <Trans id="ast.overheal.suggestion.content">
		Avoid healing your party for more than is needed. Cut back on unnecessary heals and coordinate with your co-healer to plan resources efficiently. <br/>
		* Delayed heals include heals such as <DataLink action="EXALTATION" />, <DataLink action="HOROSCOPE" />, and <DataLink action="MACROCOSMOS" /> when not manually activated.
	</Trans>

	protected override checklistDescription(_overheals: TrackedOverheal[]): JSX.Element {
		return this.content
	}

	protected override trackedHealCategories = [
		{
			name: <Trans id="ast.overheal.hot.name">Healing over Time</Trans>,
			color: SuggestedColors[1],
			trackedHealIds: [
				this.data.statuses.ASPECTED_HELIOS.id,
				this.data.statuses.WHEEL_OF_FORTUNE.id,
				this.data.statuses.ASPECTED_BENEFIC.id,
				this.data.statuses.OPPOSITION.id,
			],
		},
		{
			name: <Trans id="ast.overheal.earthlystar.name">Earthly Star</Trans>,
			color: SuggestedColors[2],
			trackedHealIds: [
				this.data.actions.STELLAR_BURST.id,
				this.data.actions.STELLAR_EXPLOSION.id,
			],
		},
		{
			name: <Trans id="ast.overheal.delayedheals.name">Delayed Heals*</Trans>, //these heals are ones that are planned a bit of time in advance, but not self-activated. i.e. is the astrologian planning well in advance? an overheal in this sense would imply that they don't trust the heals to top off the party.
			color: SuggestedColors[3],
			trackedHealIds: [
				this.data.statuses.HOROSCOPE_HELIOS.id,
				this.data.statuses.EXALTATION.id,
				this.data.statuses.MACROCOSMOS.id,
			],
		},
	]
}
