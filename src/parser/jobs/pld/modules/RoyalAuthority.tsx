import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import Checklist, {TieredRule, TARGET, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import React from 'react'

const ROYAL_AUTHORITY_SEVERITY = {
	94: TARGET.SUCCESS,
}

const DIVINE_MIGHT_SEVERITY = {
	94: TARGET.SUCCESS,
}

type Usages = {
	active: boolean,
	uses: number,
	total: number,
}

type RoyalAuthorityDependentUsages = {
	divineMight: Usages,
	atonement: Usages,
	supplication: Usages,
	sepulchre: Usages,
}

export class RoyalAuthority extends Analyser {
	static override handle = 'Royal Authority'
	static override title = t('pld.royal-authority.title')`Royal Authority`

	@dependency private checklist!: Checklist
	@dependency private data!: Data

	usages: RoyalAuthorityDependentUsages = {
		divineMight: this.createNewUsages(),
		atonement: this.createNewUsages(),
		supplication: this.createNewUsages(),
		sepulchre: this.createNewUsages(),
	};

	override initialise() {

		this.addEventHook({
			type: 'action',
			source: this.parser.actor.id,
			action: this.data.actions.ATONEMENT.id,
		}, () => this.onAction(this.usages.atonement))

		this.addEventHook({
			type: 'action',
			source: this.parser.actor.id,
			action: this.data.actions.SUPPLICATION.id,
		}, () => this.onAction(this.usages.supplication))

		this.addEventHook({
			type: 'action',
			source: this.parser.actor.id,
			action: this.data.actions.SEPULCHRE.id,
		}, () => this.onAction(this.usages.sepulchre))

		this.addEventHook({
			type: 'action',
			source: this.parser.actor.id,
			action: this.data.actions.HOLY_SPIRIT.id,
		}, () => this.onAction(this.usages.divineMight))

		this.addEventHook({
			type: 'action',
			source: this.parser.actor.id,
			action: this.data.actions.HOLY_CIRCLE.id,
		}, () => this.onAction(this.usages.divineMight))

		this.addEventHook({
			type: 'statusApply',
			target: this.parser.actor.id,
			status: this.data.statuses.ATONEMENT_READY.id,
		}, () => {
			this.onApplyStatus(this.usages.atonement)
			this.onApplyStatus(this.usages.supplication)
			this.onApplyStatus(this.usages.sepulchre)
		})

		this.addEventHook({
			type: 'statusRemove',
			target: this.parser.actor.id,
			status: this.data.statuses.ATONEMENT_READY.id,
		}, () => this.onRemoveStatus(this.usages.atonement))

		this.addEventHook({
			type: 'statusRemove',
			target: this.parser.actor.id,
			status: this.data.statuses.SUPPLICATION_READY.id,
		}, () => this.onRemoveStatus(this.usages.supplication))

		this.addEventHook({
			type: 'statusRemove',
			target: this.parser.actor.id,
			status: this.data.statuses.SEPULCHRE_READY.id,
		}, () => this.onRemoveStatus(this.usages.sepulchre))

		this.addEventHook({
			type: 'statusApply',
			target: this.parser.actor.id,
			status: this.data.statuses.DIVINE_MIGHT.id,
		}, () => this.onApplyStatus(this.usages.divineMight))

		this.addEventHook({
			type: 'statusRemove',
			target: this.parser.actor.id,
			status: this.data.statuses.DIVINE_MIGHT.id,
		}, () => this.onRemoveStatus(this.usages.divineMight))

		this.addEventHook('complete', this.onComplete)
	}

	private onApplyStatus(usages: Usages) {
		usages.active = true
		usages.total += 1
	}

	private onRemoveStatus(usages: Usages) {
		usages.active = false
	}

	private onAction(usages: Usages) {
		if (usages.active === false) { return }
		usages.uses += 1
	}

	private onComplete() {
		this.onRemoveStatus(this.usages.atonement)
		this.onRemoveStatus(this.usages.supplication)
		this.onRemoveStatus(this.usages.sepulchre)
		this.onRemoveStatus(this.usages.divineMight)

		// Leaving the following commented out since it's not actually being used right now, but here's the calculation for checking dropped stacks if that data becomes useful
		// const droppedStacks = this.swordOathHistory.reduce((dropped, swordOath) => dropped + Math.max(swordOath.initial - swordOath.used, 0), 0)

		this.checklist.add(new TieredRule({
			name: <Trans id= "pld.royal-authority.checklist.name">Use Follow Up Skills of Royal Authority</Trans>,
			description: <Trans id="pld.royal-authority.checklist.description">
				<DataLink action="ROYAL_AUTHORITY" /> generates <DataLink status="ATONEMENT_READY" /> to use on <DataLink action="ATONEMENT" /> and follow up actions <DataLink action="SUPPLICATION" /> and <DataLink action="SEPULCHRE" />.
				This is effectively the same as getting {this.usages.atonement.total + this.usages.supplication.total + this.usages.sepulchre.total} uses of <DataLink showIcon={false} action="ROYAL_AUTHORITY" /> or stronger actions.
			</Trans>,
			tiers: ROYAL_AUTHORITY_SEVERITY,
			requirements: [
				new Requirement({
					name: <Trans id="pld.royal-authority.checklist.requirement.name">
						Uses of <DataLink status="ATONEMENT_READY" /> out of possible uses
					</Trans>,
					overrideDisplay: this.getDisplayOverride(this.usages.atonement),
					percent: this.getPercent(this.usages.atonement),
				}), new Requirement({
					name: <Trans id="pld.royal-authority.checklist.requirement.name">
						Uses of <DataLink status="SUPPLICATION_READY" /> out of possible uses
					</Trans>,
					overrideDisplay: this.getDisplayOverride(this.usages.supplication),
					percent: this.getPercent(this.usages.supplication),
				}), new Requirement({
					name: <Trans id="pld.royal-authority.checklist.requirement.name">
						Uses of <DataLink status="SEPULCHRE_READY" /> out of possible uses
					</Trans>,
					overrideDisplay: this.getDisplayOverride(this.usages.sepulchre),
					percent: this.getPercent(this.usages.sepulchre),
				}),
			],
		}))

		this.checklist.add(new TieredRule({
			name: <Trans id= "pld.divine-might.checklist.name">Use the Divine Might stack generated by Royal Authority</Trans>,
			description: <Trans id="pld.divine-might.checklist.description">
				<DataLink action="ROYAL_AUTHORITY" /> and <DataLink action="PROMINENCE" /> generate 1 stack of <DataLink status="DIVINE_MIGHT" /> to empower <DataLink action="HOLY_SPIRIT" /> or <DataLink action="HOLY_CIRCLE" />.
				This buffs the damage and removes the cast time for <DataLink action="HOLY_SPIRIT" /> and <DataLink action="HOLY_CIRCLE" />.
			</Trans>,
			tiers: DIVINE_MIGHT_SEVERITY,
			requirements: [
				new Requirement({
					name: <Trans id="pld.divine-might.checklist.requirement.name">
						Uses of <DataLink status="DIVINE_MIGHT" /> out of possible uses
					</Trans>,
					overrideDisplay: this.getDisplayOverride(this.usages.divineMight),
					percent: this.getPercent(this.usages.divineMight),
				}),
			],
		}))
	}

	private getDisplayOverride(usages: Usages): string {
		return `${usages.uses} / ${usages.total} (${this.getPercent(usages).toFixed(2)}%)`
	}

	private getPercent(usages: Usages): number {
		return ((usages.uses/usages.total) * 100)
	}

	private createNewUsages() : Usages {
		return {
			active: false,
			uses: 0,
			total: 0,
		}
	}

}
