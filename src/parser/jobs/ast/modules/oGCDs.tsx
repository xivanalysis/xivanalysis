import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

//assumptions listed after each severity
const SEVERITY_PERCENTAGES = {
	HEALING_PERCENT_THRESHOLD: {
		0.8: SEVERITY.MAJOR, //less than 20% of the available time is close to not using it at all or barely //based on 80/20
		0.6: SEVERITY.MEDIUM, //40% might not be using it enough -- risks having to use GCDs to make up for lack of mitigation/heals
		0.2: SEVERITY.MINOR, //80% of the time is used to keep it on the radar, but not punish //based on 80/20
	},
	DPS_PERCENT_THRESHOLD: {
		0.25: SEVERITY.MAJOR,
		0.15: SEVERITY.MEDIUM,
		0.05: SEVERITY.MINOR,
	},
}

//assumptions on importance of healing and dps by weight. //major assumption is that dps metrics are more important than healing metrics as long as no one dies to use these dps buffs.
const WEIGHTS = {
	HEALS: 0.10,
	DPS: 1,
}

//type for action
const TYPES = {
	HEALS: 'heals',
	DPS: 'dps',
}

export class oGCDs extends CooldownDowntime {
	@dependency private suggestions!: Suggestions

	override checklistName =  <Trans id="ast.ogcds.name">Use your damage and healing OGDs</Trans>
	override checklistDescription = <Trans id="ast.ogcds.description">Consider using the below actions to help support your party with damage buffs and reduce the amount of GCD healing necessary. </Trans>
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	override checklistTarget = 80 //80% chosen since there is heavy reliance on DPS actions, but healing is usually contextual and therefore a lower target is necessary to reach

	private COOLDOWNS_TRACKED = [
		//dps actions
		{
			cooldowns: [this.data.actions.DIVINATION],
			weight: WEIGHTS.DPS,
			type: TYPES.DPS,
			content: <Trans id="ast.ogcds.divination.content">
				Consider using <DataLink action="DIVINATION" /> more frequently. <DataLink action="DIVINATION" /> provides an Astrologian with a strong amount of raid DPS.
			</Trans>,
		},
		{
			cooldowns: [this.data.actions.MACROCOSMOS],
			weight: WEIGHTS.DPS,
			type: TYPES.DPS,
			content: <Fragment><Trans id="ast.ogcds.macrocosmos.content">
				Consider using <DataLink action="MACROCOSMOS" /> more frequently. Frequent uses can heal and inflict a large amount of damage over the course of a fight, potentially resulting in fewer required healing GCDs and a shorter overall fight.
			</Trans></Fragment>,
		},

		//healing actions
		{
			cooldowns: [this.data.actions.EXALTATION],
			weight: WEIGHTS.HEALS,
			type: TYPES.HEALS,
		},
		{
			cooldowns: [this.data.actions.CELESTIAL_INTERSECTION],
			weight: WEIGHTS.HEALS,
			type: TYPES.HEALS,
		},
		{
			cooldowns: [this.data.actions.CELESTIAL_OPPOSITION],
			weight: WEIGHTS.HEALS,
			type: TYPES.HEALS,
		},
		{
			cooldowns: [this.data.actions.HOROSCOPE],
			weight: WEIGHTS.HEALS,
			type: TYPES.HEALS,
		},
		{
			cooldowns: [this.data.actions.NEUTRAL_SECT],
			weight: WEIGHTS.HEALS,
			type: TYPES.HEALS,
		},
	]
	override trackedCds = this.COOLDOWNS_TRACKED

	override addJobSuggestions() {
		this.COOLDOWNS_TRACKED.forEach(cooldownGroup => {

			// set up for suggestion(s)
			const maxUses = this.calculateMaxUsages(cooldownGroup)
			const uses = this.calculateUsageCount(cooldownGroup)
			const missed = maxUses - uses
			const percentUses = uses/maxUses

			const why = <Fragment>
				<Trans id="ast.ogcds.suggestions.why">
					You missed about {missed} out of a possible {maxUses} casts.
				</Trans>
			</Fragment>

			const action = cooldownGroup.cooldowns[0]
			if (cooldownGroup.type === 'dps' && missed !== 0) { //add each dps suggestion individually
				this.suggestions.add(new TieredSuggestion({
					icon: action.icon,
					content: cooldownGroup.content,
					why: why,
					tiers: SEVERITY_PERCENTAGES.DPS_PERCENT_THRESHOLD,
					value: missed <= 1 ? 0 : percentUses, //try not to punish for one missed cast
				}))
			}
		})

		let maxUsesHeals: number = 0
		let usesHeals: number = 0
		const healingActions: string[] = []

		this.COOLDOWNS_TRACKED.forEach(cooldownGroup => {
			if (cooldownGroup.type === 'heals') {
				maxUsesHeals += this.calculateMaxUsages(cooldownGroup)
				usesHeals += this.calculateUsageCount(cooldownGroup)
				healingActions.push(cooldownGroup.cooldowns[0].name)
			}
		})

		const missedHeals = maxUsesHeals - usesHeals
		const percentUsesHeals = usesHeals/maxUsesHeals

		const content = <Fragment><Trans id="ast.ogcds.healing.suggestions.content" >
			Try to utilize your healing oGCDs more frequently. There are opportunities to utilize the following oGCDs to reduce the overall amount of healing necessary.
		</Trans></Fragment>

		const why = <Fragment>
			<Trans id="ast.ogcds.healing.suggestions.why">
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
