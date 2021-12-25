import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime as CoreCooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const DPS_TARGET_PERCENT = 80

export class CooldownDowntime extends CoreCooldownDowntime {
	@dependency private suggestions!: Suggestions

	/**
	 * DPS cooldowns. For Sage, this is pretty much just Phlegma. Modified description since Phlegma is itself a GCD.
	 */
	trackedCds = [
		{cooldowns: [this.data.actions.PHLEGMA_III]},
	]
	override checklistDescription = <Trans id="sge.cooldownDowntime.ogcd-cd-metric"><DataLink showIcon={false} action="PHLEGMA_III"/> is stronger than <DataLink showIcon={false} action="DOSIS_III" />. Try not to lose out on using it by sitting on both charges for too long.</Trans>
	override checklistTarget = DPS_TARGET_PERCENT

	/**
	 * Healing and defensive cooldowns. Listed somewhat in order of strength/length of the cooldown.
	 */
	override defensiveCooldowns = [
		{cooldowns: [this.data.actions.PNEUMA]},
		{cooldowns: [this.data.actions.HOLOS]},
		{cooldowns: [this.data.actions.PANHAIMA]},
		{cooldowns: [this.data.actions.HAIMA]},
		{cooldowns: [this.data.actions.PHYSIS_II]},
		{cooldowns: [this.data.actions.ZOE]},
		{cooldowns: [this.data.actions.SOTERIA]},
		{cooldowns: [this.data.actions.RHIZOMATA]},
		{cooldowns: [this.data.actions.KRASIS]},
	]
	override defenseChecklistDescription = <Trans id="sge.cooldownDowntime.defense-cd-metric">
		Using your mitigation and healing cooldowns allows you to help keep the party healthy while continuing to deal damage and healing to your <DataLink showIcon={false} action="KARDIA" /> target.
		While you shouldn't waste these actions, you should try to plan out when to use them to maximize their utility.
	</Trans>

	/**
	 * Keeping track of Pepsis so we can provide a suggestion if they never used it
	 */
	override suggestionOnlyCooldowns = [
		{cooldowns: [this.data.actions.PEPSIS]},
	]

	override addJobSuggestions() {
		// Grab the Pepsis cooldown group
		const cooldownGroup = this.suggestionOnlyCooldowns[0]
		const uses = this.calculateUsageCount(cooldownGroup)

		// Only bothering with the suggestion if they never used Pepsis
		if (uses > 0) { return }

		this.suggestions.add(new Suggestion({
			icon: this.data.actions.PEPSIS.icon,
			content: <Trans id="sge.cooldowns.suggestions.pepsis.content"><DataLink showIcon={false} action="PEPSIS"/> allows you to convert unused <DataLink status="EUKRASIAN_DIAGNOSIS" /> or <DataLink status="EUKRASIAN_PROGNOSIS" /> shields into healing.
				If your party has a shield that will wear off before more damage hits, you can use <DataLink showIcon={false} action="PEPSIS" /> to help top them up and keep the shield from going to waste.</Trans>,
			severity: SEVERITY.MINOR,
			why: <Trans id="sge.cooldowns.pepsis.why">You didn't use <DataLink showIcon={false} action="PEPSIS" /></Trans>,
		}))
	}
}
