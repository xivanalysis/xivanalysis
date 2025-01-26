import {Trans} from '@lingui/react'
import {Overheal as CoreOverheal, SuggestedColors} from 'parser/core/modules/Overheal'
import React from 'react'

export class Overheal extends CoreOverheal {
	override displayPieChart = true

	override trackedHealCategories = [
		{
			name: <Trans id="ast.overheal.gcd.name">GCD Heals (including Healing over Time)</Trans>,
			trackedHealIds: [
				// Single-Target
				this.data.actions.CURE.id,
				this.data.actions.CURE_II.id,
				this.data.statuses.REGEN.id,

				// AoE
				this.data.actions.MEDICA.id,
				this.data.actions.MEDICA_II.id,
				this.data.statuses.MEDICA_II.id,
				this.data.actions.MEDICA_III.id,
				this.data.statuses.MEDICA_III.id,
				this.data.actions.CURE_III.id,
			],
			informational: false,
		},
		{
			name: <Trans id="whm.overheal.abilities-direct.name">Direct healing abilities</Trans>,
			trackedHealIds: [
				this.data.actions.TETRAGRAMMATON.id,
			],
			// Marking this as non-informational because it has no secondary purpose, and does have a charge system allowing flexibility of use
			informational: false,
		},
		{
			name: <Trans id="whm.overheal.afflatus.name">Afflatus Healing</Trans>,
			color: SuggestedColors[3],
			trackedHealIds: [
				this.data.actions.AFFLATUS_RAPTURE.id,
				this.data.actions.AFFLATUS_SOLACE.id,
			],
		},
		{
			name: <Trans id="whm.overheal.hot.name">Healing Over Time</Trans>,
			color: SuggestedColors[1],
			trackedHealIds: [
				this.data.actions.ASYLUM.id,
				this.data.statuses.ASYLUM.id,
				this.data.statuses.DIVINE_AURA.id,
			],
		},
		{
			name: <Trans id="whm.overheal.liturgyofthebell.name">Liturgy of the Bell</Trans>,
			color: SuggestedColors[2],
			trackedHealIds: [
				this.data.actions.LITURGY_OF_THE_BELL_ON_DAMAGE.id,
				this.data.actions.LITURGY_OF_THE_BELL_ON_EXPIRY.id,
				this.data.actions.LITURGY_OF_THE_BELL_ACTIVATION.id,
			],
		},
		{
			name: <Trans id="whm.overheal.abilities-other.name">Other healing abilities</Trans>,
			trackedHealIds: [
				this.data.actions.ASSIZE.id,
				this.data.actions.BENEDICTION.id,
				this.data.statuses.CONFESSION.id,
			],
		},
	]
}
