import {Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
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
		this.data.actions.SUCCOR.id,
		this.data.actions.CONCITATION.id,
		this.data.actions.ACCESSION.id,
		this.data.actions.ADLOQUIUM.id,
	]

	private readonly shieldStatusIds: Array<Status['id']> = [
		this.data.statuses.GALVANIZE.id,
		this.data.statuses.EUKRASIAN_DIAGNOSIS.id,
		this.data.statuses.EUKRASIAN_PROGNOSIS.id,
	]

	protected override trackedHealCategories: TrackedOverhealOpts[] = [
		{
			name: <Trans id="sch.overheal.gcd.name">GCD Heals (including <DataLink showIcon={false} action="EMERGENCY_TACTICS" />)</Trans>,
			trackedHealIds: [
				this.data.actions.SCH_PHYSICK.id,
			],
			bucketId: BUCKET_IDS.GCD_HEALS,
			includeInChecklist: true,
		},
		{
			name: <Trans id="sch.overheal.aetherflow.name">Aetherflow</Trans>,
			trackedHealIds: [
				this.data.actions.LUSTRATE.id,
				this.data.actions.INDOMITABILITY.id,
				this.data.statuses.EXCOGITATION.id,
			],
			// Including these in the checklist since they cost Aetherflow charges that could otherwise be used on Sacred Soil or Energy Drain
			includeInChecklist: true,
		},
		{
			name: this.defaultCategoryNames.SHIELD_GCD_OVERWRITE,
			// No trackedHealIds added by default, all events added here will be due to bucket overrides
			bucketId: BUCKET_IDS.SHIELD_OVERWRITES,
			includeInChecklist: true,
		},
		{
			name: this.defaultCategoryNames.SHIELD_GCD_APPLICATION,
			trackedHealIds: this.shieldGCDIds,
		},
		{
			name: <Trans id="sch.overheal.hot.name">Sacred Soil</Trans>,
			trackedHealIds: [
				this.data.statuses.SACRED_SOIL.id,
			],
		},
		{
			name: <Trans id="sch.overheal.fairy-and-hots.name">Fairy and HoTs</Trans>,
			trackedHealIds: [
				this.data.actions.FEY_BLESSING.id,
				this.data.actions.CONSOLATION.id,
				this.data.actions.SERAPHIC_VEIL.id,
				this.data.statuses.WHISPERING_DAWN.id,
				this.data.statuses.ANGELS_WHISPER.id,
				this.data.statuses.FEY_UNION.id,
			],
		},
		{
			name: 'Ignored Heals',
			trackedHealIds: [
				this.data.actions.EMBRACE.id,
				this.data.actions.SCH_ENERGY_DRAIN.id,
				this.data.statuses.SERAPHISM_HOT.id,
				this.data.actions.PROTRACTION.id,
			],
			ignore: true,
		},
	]

	protected override overrideHealBucket(event: Events['heal'], petHeal?: boolean): number {
		// Fairy heals don't need re-bucketing
		if (petHeal) { return -1 }

		// Hots don't need re-bucketing
		if (event.cause.type === 'status') { return -1 }

		// If the heal wasn't in the list of shield-applying actions, it doesn't need re-bucketing
		if (!this.shieldGCDIds.includes(event.cause.action)) { return -1 }

		// Bucket Emergency Tactics heals into the direct GCD heals
		if (this.actors.current.hasStatus(this.data.statuses.EMERGENCY_TACTICS.id)) {
			return BUCKET_IDS.GCD_HEALS
		}

		// If any of the targets already had one of the non-overlapping shields, bucket into the shield overwrite bucket
		if (event.targets.filter((targetEvent) => this.actors.get(targetEvent.target).hasAnyStatus(this.shieldStatusIds)).length > 0) {
			return BUCKET_IDS.SHIELD_OVERWRITES
		}

		return -1
	}
}
