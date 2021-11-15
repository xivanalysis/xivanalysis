import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

const DPS_TARGET_PERCENT = 75

export default class OGCDs extends CooldownDowntime {
	@dependency private suggestions!: Suggestions

	private DPS_COOLDOWNS_TRACKED = [
		{cooldowns: [this.data.actions.ASSIZE], weight: 1},
		{cooldowns: [this.data.actions.PRESENCE_OF_MIND], weight: 1},
	]
	private OTHER_COOLDOWNS_TRACKED = [
		{
			cooldowns: [this.data.actions.ASYLUM],
			weight: 0,
			tiers: {2: SEVERITY.MINOR, 3: SEVERITY.MEDIUM},
			content: <Fragment>
				<Trans id="whm.ogcds.suggestions.asylum.content">Use <DataLink action="ASYLUM"/> frequently in an encounter whenever party members will be close enough to stand in the bubble. For instances where members are frequently spread too far, Asylum can still be used for tank healing.</Trans>
			</Fragment>,
		},
		{
			cooldowns: [this.data.actions.DIVINE_BENISON],
			weight: 0,
			tiers: {8: SEVERITY.MINOR, 12: SEVERITY.MEDIUM},
			content: <Fragment>
				<Trans id="whm.ogcds.suggestions.divine_benison.content">Weave <DataLink action="DIVINE_BENISON"/> as often as possible to minimize single target healing needed. However, it is not worth clipping to apply a benison. Do not hold Divine Benison for tank busters. Since Dia's duration is 30s, try to weave Divine Benison with every Dia that you don't have two more important weaves to execute.</Trans>
			</Fragment>,
		},
		{
			cooldowns: [this.data.actions.PLENARY_INDULGENCE],
			weight: 0,
			tiers: {1: SEVERITY.MINOR},
			content: <Fragment>
				<Trans id="whm.ogcds.suggestions.plenary_indulgence.content">Use <DataLink action="PLENARY_INDULGENCE"/> when casting GCD AOE heals when the extra potency will reduce the amount of additional heals needed. Avoiding clipping to apply this, and only consider clipping if the additional healing will save subsequent a GCD heal cast.</Trans>
			</Fragment>,
		},
		{
			cooldowns: [this.data.actions.TEMPERANCE],
			weight: 0,
			tiers: {2: SEVERITY.MINOR, 3: SEVERITY.MEDIUM},
			content: <Fragment>
				<Trans id="whm.ogcds.suggestions.temperance.content">Use <DataLink action="TEMPERANCE"/> often to mitigate incoming raid damage and boost GCD healing potency. Avoid clipping to apply it.</Trans>
			</Fragment>,
		},
	]
	override trackedCds = this.DPS_COOLDOWNS_TRACKED.concat(this.OTHER_COOLDOWNS_TRACKED)

	override checklistTarget = DPS_TARGET_PERCENT

	override addJobSuggestions() {
		this.OTHER_COOLDOWNS_TRACKED.forEach(cooldownGroup => {

			// set up for suggestion(s)
			const maxUses = this.calculateMaxUsages(cooldownGroup)
			const uses = this.usages.get(cooldownGroup)?.length ?? 0
			const missed = maxUses - uses

			const why = <Fragment>
				<Trans id="whm.ogcds.suggestions.why">
					You missed about {missed} out of a possible {maxUses} casts.
				</Trans>
			</Fragment>

			const action = cooldownGroup.cooldowns[0]
			this.suggestions.add(new TieredSuggestion({
				icon: action.icon,
				content: cooldownGroup.content,
				why: why,
				tiers: cooldownGroup.tiers,
				value: missed,
			}))
		})
	}
}
