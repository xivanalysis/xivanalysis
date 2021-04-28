import { t } from '@lingui/macro'
import { Trans } from '@lingui/react'
import { ActionLink } from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import { BuffWindowModule, BuffWindowState, BuffWindowTrackedAction } from 'parser/core/modules/BuffWindow'
import { SEVERITY } from 'parser/core/modules/Suggestions'
import React from 'react'


const SEVERITIES = {
	MISSING_EXPECTED_USES: {
		1: SEVERITY.MINOR,
		4: SEVERITY.MEDIUM,
		8: SEVERITY.MAJOR,
	},

	TOO_FEW_GCDS: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
}

const EXPECTED_USES = {
	BURST_STRIKE: 2, //This is assuming that you enter NM with 2 carts: 1st cart: Gnashing, 2nd cart: Burst, 3rd cart gained from combo mid NM: Burst
	GNASHING_FANG: 1,
	SONIC_BREAK: 1,
	ROUGH_DIVIDE: 1,
	BLASTING_ZONE: 1,
	BOW_SHOCK: 1,
	GCD: 9,

	// Don't check for correct Continuations; that will be covered by the Continuation module.
	// Don't check for correctness on the Gnashing Fang combo; that's covered by the built-in Combo tracker.
}


export default class NoMercy extends BuffWindowModule {
	static handle = 'nomercy'
	static title = t('gnb.nomercy.title')`No Mercy Windows`

	buffAction = ACTIONS.NO_MERCY
	buffStatus = STATUSES.NO_MERCY

	rotationTableNotesColumnHeader = <Trans id="gnb.nomercy.notes.header"> Bloodfest Used </Trans>

	expectedGCDs = {
		expectedPerWindow: EXPECTED_USES.GCD,
		suggestionContent: <Trans id="gnb.nomercy.suggestions.gcds.content">
			Try to land 9 GCDs during every <ActionLink {...ACTIONS.NO_MERCY} /> window. A 20 second duration is sufficient
				to comfortably fit 9 GCDs with full uptime if you wait until the last one-third of your GCD timer to activate it.
			</Trans>,
		severityTiers: SEVERITIES.TOO_FEW_GCDS,
	}

	trackedActions = {
		icon: ACTIONS.NO_MERCY.icon,
		actions: [
			{
				action: ACTIONS.GNASHING_FANG,
				expectedPerWindow: EXPECTED_USES.GNASHING_FANG,
			},

			{
				action: ACTIONS.BURST_STRIKE,
				expectedPerWindow: EXPECTED_USES.BURST_STRIKE,
			},

			{
				action: ACTIONS.SONIC_BREAK,
				expectedPerWindow: EXPECTED_USES.SONIC_BREAK,
			},

			{
				action: ACTIONS.BLASTING_ZONE,
				expectedPerWindow: EXPECTED_USES.BLASTING_ZONE,
			},

			{
				action: ACTIONS.BOW_SHOCK,
				expectedPerWindow: EXPECTED_USES.BOW_SHOCK,
			},

			{
				action: ACTIONS.ROUGH_DIVIDE,
				expectedPerWindow: EXPECTED_USES.ROUGH_DIVIDE,
			},
		],

		suggestionContent: <Trans id="gnb.nomercy.suggestions.expected-uses.content">
			Watch your uses of certain abilities during <ActionLink {...ACTIONS.NO_MERCY} />. Under ideal conditions, you should
				be using <ActionLink {...ACTIONS.SONIC_BREAK} />, a full <ActionLink {...ACTIONS.GNASHING_FANG} /> combo, and all of
				your off-GCD skills - <ActionLink {...ACTIONS.BLASTING_ZONE} />, <ActionLink {...ACTIONS.BOW_SHOCK} />, and at least one
				charge of <ActionLink {...ACTIONS.ROUGH_DIVIDE} /> - under the buff duration.
			</Trans>,
		severityTiers: SEVERITIES.MISSING_EXPECTED_USES,

	}

	changeExpectedTrackedActionClassLogic(buffWindow: BuffWindowState, action: BuffWindowTrackedAction) {

		if (action.action.id === ACTIONS.BURST_STRIKE.id) {

			if (buffWindow.rotation.find(cast => cast.ability.guid === ACTIONS.BLOODFEST.id) && (this.getBaselineExpectedTrackedAction(buffWindow, action) === 2)) {

				return 1
				//In fights with minimal downtime, it is possible to hit 4/4 bloodfests,
				//however I feel it is better to leave it at 3 / 3 for the adjusted rinfest window which seems to be more common
			}


		}

		return 0
	}

	getBuffWindowNotes(buffWindow: BuffWindowState) {
		return buffWindow.rotation.find(cast => cast.ability.guid === ACTIONS.BLOODFEST.id) ?
			<Trans id="gnb.nomercy.chart.notes.yes"> Yes </Trans> : <Trans id = "gnb.nomercy.chart.notes.no"> No </Trans>
	}
	
}
