import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Analyser} from 'parser/core/Analyser'
import Checklist, { TieredRule, TARGET, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import React from 'react'
import {dependency} from '../../../core/Injectable'

const STACKS_GAINED = 3

// In seconds
const UPTIME = {
		95: TARGET.WARN,
		100: TARGET.SUCCESS,
}

export default class Atonement extends Analyser {
	static override handle = 'Atonement'
	static override title = t('pld.Atonement.title')`Atonement`

	@dependency private checklist!: Checklist
	@dependency private data!: Data

	protected actions: number = 0
	protected buffs: number = 0

	override initialise() {

		this.addEventHook({
			type: 'action',
			source: this.parser.actor.id,
			action: this.data.actions.ATONEMENT.id,
		}, this.onAtonement)

		this.addEventHook({
			type: 'statusApply',
			target: this.parser.actor.id,
			status: this.data.statuses.SWORD_OATH.id,
		}, this.onRoyal)

		this.addEventHook('complete', this.onComplete)
	}

	private onAtonement() {
		this.actions++
	}

	private onRoyal() {
		this.buffs = this.buffs + STACKS_GAINED
	}

	private onComplete() {

		this.checklist.add(new TieredRule({
			name: 'Use Atonements Generated By Royal Authority',
			description: <Trans id="pld.atonement.checklist.description">
				<ActionLink {...this.data.actions.ROYAL_AUTHORITY} /> generates 3 stacks of Sword Oath to use on <ActionLink {...this.data.actions.ATONEMENT} />,
				this is effectively the same as getting 3 <ActionLink {...this.data.actions.ROYAL_AUTHORITY} /> and you should make sure to use all stacks generated.
			</Trans>,
			tiers: UPTIME,
			requirements: [
				new Requirement({
					name: <Trans id="pld.atonement.checklist.requirement.atonement.name">
						Uses of <ActionLink {...this.data.actions.ATONEMENT} /> out of possible uses 
					</Trans>,
					overrideDisplay: `${this.actions} / ${this.buffs} (${this.getPercent().toFixed(2)}%)`,
					percent: this.getPercent(),
				}),
			],
		}))
	}

	private getPercent() {
		const actual = this.actions
		const possible = this.buffs
		return ((actual/possible) * 100)
	}

}
