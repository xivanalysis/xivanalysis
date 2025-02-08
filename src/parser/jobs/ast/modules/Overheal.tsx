import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Events} from 'event'
import {Overheal as CoreOverheal, TrackedOverhealOpts} from 'parser/core/modules/Overheal'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const NEUTRAL_SECT_APPLICATION_BUCKET_ID = 1

export class Overheal extends CoreOverheal {
	protected override checklistDisplayOrder = DISPLAY_ORDER.OVERHEAL_CHECKLIST

	private readonly shieldGCDIds: Array<Action['id']> = [
		this.data.actions.ASPECTED_BENEFIC.id,
		this.data.actions.ASPECTED_HELIOS.id,
		this.data.actions.HELIOS_CONJUNCTION.id,
	]

	protected override trackedHealCategories: TrackedOverhealOpts[] = [
		{
			name: this.defaultCategoryNames.DIRECT_GCD_HEALS,
			trackedHealIds: [
				// Single-Target
				this.data.actions.BENEFIC.id,
				this.data.actions.ASPECTED_BENEFIC.id,

				// AoE
				this.data.actions.HELIOS.id,
				this.data.actions.ASPECTED_HELIOS.id,
				this.data.actions.HELIOS_CONJUNCTION.id,
			],
			includeInChecklist: true,
		},
		{
			name: this.defaultCategoryNames.OVER_TIME_GCD_HEALS,
			trackedHealIds: [
				// Single-Target
				this.data.statuses.ASPECTED_BENEFIC.id,

				// AoE
				this.data.statuses.ASPECTED_HELIOS.id,
				this.data.statuses.HELIOS_CONJUNCTION.id,
			],
			includeInChecklist: true,
		},
		{
			name: this.defaultCategoryNames.DIRECT_HEALING_ABILITIES,
			trackedHealIds: [
				this.data.actions.ESSENTIAL_DIGNITY.id,
			],
			// Including this in the checklist because it has no secondary purpose, and does have a charge system allowing flexibility of use
			includeInChecklist: true,
		},
		{
			name: <Trans id="ast.overheal.neutral_sect_gcd.name">GCDs applying <DataLink showIcon={false} status="NEUTRAL_SECT_OTHERS" /></Trans>,
			// No trackedHealIds added by default, all events added here will be due to bucket overrides
			bucketId: NEUTRAL_SECT_APPLICATION_BUCKET_ID,
		},
		{
			name: <Trans id="ast.overheal.cards.name">Cards</Trans>,
			trackedHealIds: [
				this.data.actions.LADY_OF_CROWNS.id,
				this.data.statuses.THE_EWER.id,
			],
		},
		{
			// These heals are ones that are planned a bit of time in advance, but not self-activated.
			// i.e. is the astrologian planning well in advance?
			// an overheal in this sense would imply that they don't trust the heals to top off the party.
			name: <Trans id="ast.overheal.delayedheals.name">Delayed Heals</Trans>,
			trackedHealIds: [
				this.data.actions.STELLAR_BURST.id,
				this.data.actions.STELLAR_EXPLOSION.id,
				this.data.actions.HOROSCOPE_ACTIVATION.id,
				this.data.statuses.HOROSCOPE.id,
				this.data.statuses.HOROSCOPE_HELIOS.id,
				this.data.statuses.EXALTATION.id,
				this.data.statuses.MACROCOSMOS.id,
			],
		},
		{
			name: this.defaultCategoryNames.OTHER_HEALING_ABILITIES,
			trackedHealIds: [
				this.data.actions.CELESTIAL_INTERSECTION.id,
				this.data.statuses.WHEEL_OF_FORTUNE.id,
				this.data.actions.CELESTIAL_OPPOSITION.id,
				this.data.statuses.OPPOSITION.id,
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

	protected override overrideHealBucket(event: Events['heal'], petHeal?: boolean): number {
		// Star heals don't need re-bucketing
		if (petHeal) { return -1 }

		// Hots don't need re-bucketing
		if (event.cause.type === 'status') { return -1 }

		// If the heal wasn't in the list of shield-applying actions, it doesn't need re-bucketing
		if (!this.shieldGCDIds.includes(event.cause.action)) { return -1 }

		// If the player doesn't have Neutral up, it can't apply a shield so doesn't need re-bucketing
		if (!this.actors.current.hasStatus(this.data.statuses.NEUTRAL_SECT.id)) { return -1 }

		// If any of the targets did not currently have the Neutral Sect shield on, override it into the Neutral Sect application bucket
		if (event.targets.filter((targetEvent) =>
			!this.actors.get(targetEvent.target).hasStatus(this.data.statuses.NEUTRAL_SECT_OTHERS.id)).length > 0) {
			return NEUTRAL_SECT_APPLICATION_BUCKET_ID
		}

		// Otherwise, no bucket overriding required
		return -1
	}
}
