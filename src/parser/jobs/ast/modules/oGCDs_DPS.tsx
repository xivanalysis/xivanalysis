import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

//assumptions listed after each severity
const SEVERITY_PERCENTAGES = {
	DPS_PERCENT_THRESHOLD: {
		0.25: SEVERITY.MAJOR,
		0.15: SEVERITY.MEDIUM,
		0.05: SEVERITY.MINOR,
	},
}

export class oGCDs_DPS extends CooldownDowntime {
	@dependency private suggestions!: Suggestions

	override checklistName =  <Trans id="ast.ogcds_dps.name">Use your damage OGDs</Trans>
	override checklistDescription = <Trans id="ast.ogcds_dps.description">Try to use the below actions further increase the amount of damage output by the party. <DataLink action="DIVINATION" /> will increase everyones damage and should be timed with raid buff windows when possible. <DataLink action="MACROCOSMOS" /> provides an oGCD AOE attack coupled with delayed healing. </Trans>
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	override checklistTarget = 80 //80% chosen since there is heavy reliance on DPS actions

	private COOLDOWNS_TRACKED = [
		//dps actions
		{
			cooldowns: [this.data.actions.DIVINATION],
			weight: 1,
			content: <Trans id="ast.ogcds_dps.divination.content">
				Consider using <DataLink action="DIVINATION" /> more frequently. <DataLink action="DIVINATION" /> provides an Astrologian with a strong amount of raid DPS.
			</Trans>,
		},
		{
			cooldowns: [this.data.actions.MACROCOSMOS],
			weight: 0.5, //half-weight used since macrocosmos can be utilized as a healing tool as well.
			content: <Fragment><Trans id="ast.ogcds_dps.macrocosmos.content">
				Consider using <DataLink action="MACROCOSMOS" /> more frequently. Frequent uses can heal and inflict a large amount of damage over the course of a fight, potentially resulting in fewer required healing GCDs and a shorter overall fight.
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
			const percentUses = uses/maxUses

			const why = <Fragment>
				<Trans id="ast.ogcds_dps.suggestions.why">
					You missed about {missed} out of a possible {maxUses} casts.
				</Trans>
			</Fragment>

			const action = cooldownGroup.cooldowns[0]
			if (missed !== 0) { //add each dps suggestion individually
				this.suggestions.add(new TieredSuggestion({
					icon: action.icon,
					content: cooldownGroup.content,
					why: why,
					tiers: SEVERITY_PERCENTAGES.DPS_PERCENT_THRESHOLD,
					value: missed <= 1 ? 0 : percentUses, //try not to punish for one missed cast
				}))
			}
		})
	}
}
