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
		0.4: SEVERITY.MEDIUM, //60% is not using it enough -- risks having to use GCDs to make up for lack of mitigation/heals
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
	HEALS: 0.25,
	DPS: 1,
}

//type for action
const TYPES = {
	HEALS: 'heals',
	DPS: 'dps',
}

export default class oGCDs extends CooldownDowntime {
	@dependency private suggestions!: Suggestions

	override checklistName =  <Trans id="ast.ogcds.name">Use your OGDs</Trans>
	override checklistDescription = <Trans id="ast.ogcds.description">Consider using the below actions to help support your party with damage buffs and reduce the amount of GCD healing necessary. </Trans>
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	override checklistTarget = 80 //80% chosen since there is heavy reliance on DPS actions, but healing is usually contextual and therefore a lower target is necessary to reach

	private COOLDOWNS_TRACKED = [
		//dps actions
		{
			cooldowns: [this.data.actions.DIVINATION],
			weight: WEIGHTS.DPS,
			type: TYPES.DPS,
			content: <Trans id="ast.ogcds.divination.description">
				Consider using <DataLink action="DIVINATION" /> more frequently. <DataLink action="DIVINATION" /> provides an Astrologian with a strong amount of raid DPS.
			</Trans>,
		},
		{
			cooldowns: [this.data.actions.MACROCOSMOS],
			weight: WEIGHTS.DPS,
			type: TYPES.DPS,
			content: <Fragment><Trans id="ast.ogcds.macrocosmos.description">
				Consider using <DataLink action="MACROCOSMOS" /> more frequently. Frequent uses can heal and inflict a large amount of damage over the course of a fight, potentially resulting in fewer required healing GCDs and a shorter overall fight.
			</Trans></Fragment>,
		},

		//healing actions
		{
			cooldowns: [this.data.actions.EXALTATION],
			weight: WEIGHTS.HEALS,
			type: TYPES.HEALS,
			content: <Fragment><Trans id="ast.ogcds.exaltation.description">
				Consider using <DataLink action="EXALTATION" /> more frequently. Frequent uses can heal and mitigate a large amount of damage over the course of a fight, potentially resulting in fewer required healing GCDs. Additionally, <DataLink action="EXALTATION" showIcon={false} /> can provide significant healing and mitigation when timed closely with tank busters.
			</Trans></Fragment>,
		},
		{
			cooldowns: [this.data.actions.CELESTIAL_INTERSECTION],
			weight: WEIGHTS.HEALS,
			type: TYPES.HEALS,
			content: <Fragment><Trans id="ast.ogcds.celestial.intersection.description">
				Consider using <DataLink action="CELESTIAL_INTERSECTION" /> more frequently. Frequent uses can mitigate a large amount of damage over the course of a fight, potentially resulting in fewer required healing GCDs.
			</Trans></Fragment>,
		},
		{
			cooldowns: [this.data.actions.CELESTIAL_OPPOSITION],
			weight: WEIGHTS.HEALS,
			type: TYPES.HEALS,
			content: <Fragment><Trans id="ast.celestial-opposition.suggestion.content">
				Consider using <DataLink action="CELESTIAL_OPPOSITION" /> more frequently.
				The heal and regen combined add up to the same potency of a <DataLink action="BENEFIC_II" /> on each player it reaches.
				Trusting the regens to top off the party HP will save MP and GCDs on healing.
			</Trans></Fragment>,
		},
		{
			cooldowns: [this.data.actions.NEUTRAL_SECT],
			weight: WEIGHTS.HEALS,
			type: TYPES.HEALS,
			content: <Fragment><Trans id="ast.neutral-sect.suggestion.content">
				Consider using <DataLink action="NEUTRAL_SECT" /> more frequently.
				Frequent uses can mitigate a large amount of damage over the course of a fight, potentially resulting in fewer required healing GCDs.
			</Trans></Fragment>,
		},
	]
	override trackedCds = this.COOLDOWNS_TRACKED

	override addJobSuggestions() {
		this.COOLDOWNS_TRACKED.forEach(cooldownGroup => {

			// set up for suggestion(s)
			const maxUses = this.calculateMaxUsages(cooldownGroup)
			const uses = this.calculateUsageCount(cooldownGroup)
			const missed = maxUses - uses
			const percentMissed = missed/maxUses

			const why = <Fragment>
				<Trans id="ast.ogcds.suggestions.why">
					You missed about {missed} out of a possible {maxUses} casts.
				</Trans>
			</Fragment>

			const action = cooldownGroup.cooldowns[0]
			this.suggestions.add(new TieredSuggestion({
				icon: action.icon,
				content: cooldownGroup.content,
				why: why,
				tiers: cooldownGroup.type === 'heals' ? SEVERITY_PERCENTAGES.HEALING_PERCENT_THRESHOLD : SEVERITY_PERCENTAGES.DPS_PERCENT_THRESHOLD,
				value: percentMissed,
			}))
		})
	}
}
