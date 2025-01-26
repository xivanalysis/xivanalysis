import {Trans} from '@lingui/macro'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Events} from 'event'
import {Overheal as CoreOverheal, TrackedOverhealOpts} from 'parser/core/modules/Overheal'
import React from 'react'

const BUCKET_IDS = {
	GCD_HEALS: 1,
	SHIELD_OVERWRITES: 2,
}

export class Overheal extends CoreOverheal {
	private readonly shieldGCDIds: Array<Action['id']> = [
		this.data.actions.EUKRASIAN_DIAGNOSIS.id,
		this.data.actions.EUKRASIAN_PROGNOSIS.id,
		this.data.actions.EUKRASIAN_PROGNOSIS_II.id,
	]

	private readonly shieldStatusIds: Array<Status['id']> = [
		this.data.statuses.GALVANIZE.id,
		this.data.statuses.EUKRASIAN_DIAGNOSIS.id,
		this.data.statuses.EUKRASIAN_PROGNOSIS.id,
	]

	protected override trackedHealCategories: TrackedOverhealOpts[] = [
		{
			name: <Trans id="sge.overheal.direct.name">GCD Heals</Trans>,
			trackedHealIds: [
				// Single-Target
				this.data.actions.DIAGNOSIS.id,

				// AoE
				this.data.actions.PROGNOSIS.id,
			],
			bucketId: BUCKET_IDS.GCD_HEALS,
			includeInChecklist: true,
		},
		{
			name: <Trans id="sge.overheal.abilities-direct.name">Direct healing abilities</Trans>,
			trackedHealIds: [
				this.data.actions.PEPSIS.id,
			],
			// Marking this as non-informational because it has no secondary purpose
			includeInChecklist: true,
		},
		{
			name: <Trans id="sge.overheal.shield-overwrites.name">Shield GCDs (overwritten shield)</Trans>,
			// No trackedHealIds added by default, all events added here will be due to bucket overrides
			bucketId: BUCKET_IDS.SHIELD_OVERWRITES,
			includeInChecklist: true,
		},
		{
			name: <Trans id="sge.overheal.shield-application.name">Shield GCDs (fresh application)</Trans>,
			trackedHealIds: this.shieldGCDIds,
		},
		{
			name: <Trans id="sge.overheal.addersgall.name">Addersgall abilities</Trans>,
			trackedHealIds: [
				this.data.statuses.KERAKEIA.id,
				this.data.actions.DRUOCHOLE.id,
				this.data.actions.IXOCHOLE.id,
				this.data.actions.TAUROCHOLE.id,
			],
		},
		{
			name: <Trans id="sge.overheal.haima.name">Haima &amp; Panhaima Expiration</Trans>,
			trackedHealIds: [
				this.data.statuses.HAIMATINON.id,
				this.data.statuses.PANHAIMATINON.id,
			],
		},
		{
			name: <Trans id="sge.overheal.other.name">Other abilities</Trans>,
			trackedHealIds: [
				this.data.actions.HOLOS.id,
				this.data.statuses.PHYSIS.id,
				this.data.statuses.PHYSIS_II.id,
				this.data.actions.PNEUMA_HEAL.id,
				this.data.statuses.EUDAIMONIA.id,
			],
		},
		{
			name: 'Kardia',
			trackedHealIds: [
				this.data.statuses.KARDIA.id,
			],
			// Still just ignoring this since it won't impact the player's decision-making
			ignore: true,
		},
	]

	protected override overrideHealBucket(event: Events['heal'], petHeal?: boolean): number {
		// SGE doesn't have pet heals, but if they did, we wouldn't re-bucket
		if (petHeal) { return -1 }

		// Hots don't need re-bucketing
		if (event.cause.type === 'status') { return -1 }

		// If the heal wasn't in the list of shield-applying actions, it doesn't need re-bucketing
		if (!this.shieldGCDIds.includes(event.cause.action)) { return -1 }

		// If any of the targets already had one of the non-overlapping shields, bucket into the shield overwrite bucket
		if (event.targets.filter((targetEvent) => this.actors.get(targetEvent.target).hasAnyStatus(this.shieldStatusIds)).length > 0) {
			return BUCKET_IDS.SHIELD_OVERWRITES
		}

		return -1
	}
}
