import {Trans} from '@lingui/react'
import {Events} from 'event'
import {Overheal as CoreOverheal, TrackedOverhealOpts} from 'parser/core/modules/Overheal'

export class Overheal extends CoreOverheal {
	protected override trackedHealCategories: TrackedOverhealOpts[] = [
		{
			name: this.defaultCategoryNames.DIRECT_GCD_HEALS,
			trackedHealIds: [
				// Single-Target
				this.data.actions.CURE.id,
				this.data.actions.CURE_II.id,

				// AoE
				this.data.actions.MEDICA.id,
				this.data.actions.MEDICA_II.id,
				this.data.actions.MEDICA_III.id,
				this.data.actions.CURE_III.id,
			],
			includeInChecklist: true,
		},
		{
			name: this.defaultCategoryNames.OVER_TIME_GCD_HEALS,
			trackedHealIds: [
				// Single-Target
				this.data.statuses.REGEN.id,

				// AoE
				this.data.statuses.MEDICA_II.id,
				this.data.statuses.MEDICA_III.id,
			],
			includeInChecklist: true,
		},
		{
			name: this.defaultCategoryNames.DIRECT_HEALING_ABILITIES,
			trackedHealIds: [
				this.data.actions.TETRAGRAMMATON.id,
			],
			// Including this in the checklist because it has no secondary purpose, and does have a charge system allowing flexibility of use
			includeInChecklist: true,
		},
		{
			name: <Trans id="whm.overheal.afflatus.name">Afflatus Healing</Trans>,
			trackedHealIds: [
				this.data.actions.AFFLATUS_RAPTURE.id,
				this.data.actions.AFFLATUS_SOLACE.id,
			],
		},
		{
			name: this.defaultCategoryNames.HEALING_OVER_TIME,
			trackedHealIds: [
				this.data.actions.ASYLUM.id,
				this.data.statuses.ASYLUM.id,
				this.data.statuses.DIVINE_AURA.id,
			],
		},
		{
			name: <Trans id="whm.overheal.liturgyofthebell.name">Liturgy of the Bell</Trans>,
			trackedHealIds: [
				this.data.actions.LITURGY_OF_THE_BELL_ON_DAMAGE.id,
				this.data.actions.LITURGY_OF_THE_BELL_ON_EXPIRY.id,
				this.data.actions.LITURGY_OF_THE_BELL_ACTIVATION.id,
			],
		},
		{
			name: this.defaultCategoryNames.OTHER_HEALING_ABILITIES,
			trackedHealIds: [
				this.data.actions.ASSIZE.id,
				this.data.actions.BENEDICTION.id,
				this.data.statuses.CONFESSION.id,
			],
		},
	]

	protected override considerHeal(event: Events['heal'], pet?: boolean): boolean {
		// Default consideration for heals from actions and pet effects (ie. Star)
		if (event.cause.type === 'action' || pet) { return true }

		// If this heal status effect was not part of the GCD regen group, consider it like normal
		if (!this.trackedHealCategories.find((group) =>
			group.name === this.defaultCategoryNames.OVER_TIME_GCD_HEALS)?.trackedHealIds?.includes(event.cause.status)) {
			return true
		}

		// If the status effect was last applied during downtime, we'll ignore it
		if (this.statusAppliedInDowntime.get(event.cause.status)) {
			return false
		}

		return true
	}
}
