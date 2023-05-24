import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

const DPS_TARGET_PERCENT = 75

export class OGCDs extends CooldownDowntime {
	@dependency private suggestions!: Suggestions

	trackedCds = [
		{cooldowns: [this.data.actions.ASSIZE], weight: 1},
		{cooldowns: [this.data.actions.PRESENCE_OF_MIND], weight: 1},
	]
	override suggestionOnlyCooldowns = [
		{
			cooldowns: [this.data.actions.LITURGY_OF_THE_BELL],
			tiers: {2: SEVERITY.MINOR, 3: SEVERITY.MEDIUM},
			content: <Fragment>
				<Trans id="whm.ogcds.suggestions.liturgyofthebell.content">Use <DataLink action="LITURGY_OF_THE_BELL"/> in an encounter when required to heal multiple hits in a row.</Trans>
			</Fragment>,
		},
		{
			cooldowns: [this.data.actions.ASYLUM],
			tiers: {2: SEVERITY.MINOR, 3: SEVERITY.MEDIUM},
			content: <Fragment>
				<Trans id="whm.ogcds.suggestions.asylum.content">Use <DataLink action="ASYLUM"/> frequently in an encounter whenever party members will be close enough to stand in the bubble. For instances where members are frequently spread too far, Asylum can still be used for tank healing.</Trans>
			</Fragment>,
		},
		{
			cooldowns: [this.data.actions.AQUAVEIL],
			tiers: {2: SEVERITY.MINOR, 3: SEVERITY.MEDIUM},
			content: <Fragment>
				<Trans id="whm.ogcds.suggestions.AQUAVEIL.content">Use <DataLink action="AQUAVEIL"/> as often as possible to minimize single target healing needed. </Trans>
			</Fragment>,
		},
		{
			cooldowns: [this.data.actions.DIVINE_BENISON],
			tiers: {8: SEVERITY.MINOR, 12: SEVERITY.MEDIUM},
			content: <Fragment>
				<Trans id="whm.ogcds.suggestions.divine_benison.content">Weave <DataLink action="DIVINE_BENISON"/> as often as possible to minimize single target healing needed. However, it is not worth clipping to apply a benison. Do not hold Divine Benison for tank busters. Since Dia's duration is 30s, try to weave Divine Benison with every Dia that you don't have two more important weaves to execute.</Trans>
			</Fragment>,
		},
		{
			cooldowns: [this.data.actions.TEMPERANCE],
			tiers: {2: SEVERITY.MINOR, 3: SEVERITY.MEDIUM},
			content: <Fragment>
				<Trans id="whm.ogcds.suggestions.temperance.content">Use <DataLink action="TEMPERANCE"/> often to mitigate incoming raid damage and boost GCD healing potency. Avoid clipping to apply it.</Trans>
			</Fragment>,
		},
	]

	override checklistTarget = DPS_TARGET_PERCENT

	override addJobSuggestions() {
		this.suggestionOnlyCooldowns.forEach(cooldownGroup => {

			// set up for suggestion(s)
			const maxUses = this.calculateMaxUsages(cooldownGroup)
			const uses = this.calculateUsageCount(cooldownGroup)
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
