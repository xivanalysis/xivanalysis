import {Trans} from '@lingui/react'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime_copy} from 'parser/core/modules/CooldownDowntime_copy'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

//assumptions listed after each severity
const SEVERITY_PERCENTAGES = {
	HEALING_PERCENT_THRESHOLD: {
		0.8: SEVERITY.MAJOR, //less than 20% of the available time is close to not using it at all or barely //based on 80/20
		0.6: SEVERITY.MEDIUM, //40% might not be using it enough -- risks having to use GCDs to make up for lack of mitigation/heals
		0.2: SEVERITY.MINOR, //80% of the time is used to keep it on the radar, but not punish //based on 80/20
	},
}

export class oGCDs_HEALS extends CooldownDowntime_copy {
	@dependency private suggestions!: Suggestions

	override checklistName =  <Trans id="ast.ogcds_heals.name">Use your healing OGDs</Trans>
	override checklistDescription = <Trans id="ast.ogcds_heals.description">Try to use your healing oGCDs to reduce the amount of GCD healing necessary. The below list provides an oGCD healing snapshot for you to consider as you progress with your parties and is not meant to be an extensive healing checklist to complete. </Trans>
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	override checklistTarget = 50 //50% chosen since healing can be fairly contextual relying on the fight, party, and co-healer

	private COOLDOWNS_TRACKED = [
		//healing oGCD actions
		{
			cooldowns: [this.data.actions.EXALTATION],
		},
		{
			cooldowns: [this.data.actions.CELESTIAL_INTERSECTION],
		},
		{
			cooldowns: [this.data.actions.CELESTIAL_OPPOSITION],
		},
		{
			cooldowns: [this.data.actions.HOROSCOPE],
		},
		{
			cooldowns: [this.data.actions.NEUTRAL_SECT],
		},
	]
	override trackedCds = this.COOLDOWNS_TRACKED

	override addJobSuggestions() {
		let maxUsesHeals: number = 0
		let usesHeals: number = 0
		const healingActions: string[] = []

		this.COOLDOWNS_TRACKED.forEach(cooldownGroup => {
			maxUsesHeals += this.calculateMaxUsages(cooldownGroup)
			usesHeals += this.calculateUsageCount(cooldownGroup)
			healingActions.push(cooldownGroup.cooldowns[0].name)
		})

		const missedHeals = maxUsesHeals - usesHeals
		const percentUsesHeals = usesHeals/maxUsesHeals

		const content = <Fragment><Trans id="ast.ogcds_heals.suggestions.content" >
			Try to utilize your healing oGCDs more frequently. There are opportunities to utilize the following oGCDs to reduce the overall amount of healing necessary.
		</Trans></Fragment>

		const why = <Fragment>
			<Trans id="ast.ogcds_heals.suggestions.why">
				Healing oGCDs were utilized {(percentUsesHeals*100).toFixed(2) + '%'} of the time for all tracked actions*.  Additional oGCD heals can be weaved along with your dps actions to reduce the amount of GCD healing necessary.<br/>
				*Tracked actions include: {healingActions.join(', ')} as noted in the "use your oGCDs" above.
			</Trans>
		</Fragment>

		if (missedHeals !== 0) { //add each dps suggestion individually
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.CELESTIAL_INTERSECTION.icon,
				content: content,
				why: why,
				tiers: SEVERITY_PERCENTAGES.HEALING_PERCENT_THRESHOLD,
				value: 1 - percentUsesHeals,
			}))
		}
	}
}
