import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class Ogi extends Analyser {
	static override handle = 'ogi'
	@dependency private checklist!: Checklist
	@dependency private data!: Data

	private ogiReadys = 0
	private ogisDone = 0

	Ogis = [
		this.data.actions.OGI_NAMIKIRI.id,
		this.data.actions.KAESHI_NAMIKIRI.id,
	]

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type('statusApply')
				.status(this.data.statuses.OGI_NAMIKIRI_READY.id),
			this.onOgiReady)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(oneOf(this.Ogis)),
			this.onOgi,
		)
		this.addEventHook('complete', this.onComplete)
	}

	private onOgiReady() {
		this.OgiReadys++
	}

	private onOgi()	{
		this.OgisDone++
	}

	private onComplete() {
		this.checklist.add(new Rule({
			name: 'Use Your Ogis',
			displayOrder: DISPLAY_ORDER.OGI,
			description: <Trans id="sam.ogi.waste.content">
				Using <DataLink action = "IKISHOTEN"/> grants <DataLink status = "OGI_NAMIKIRI_READY"/> which is consumed to use <DataLink action="OGI_NAMIKIRI"/> and <DataLink action="KAESHI_NAMIKIRI"/>.
				Using these skills are important for both your damage output and rotational alignment as <DataLink action="OGI_NAMIKIRI"/> and <DataLink action="KAESHI_NAMIKIRI"/> replace your filler GCDs.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="sam.ogi.checklist.requirement.waste.name">
						Use as many of your meditation stacks as possible.
					</Trans>,
					value: this.OgisDone,
					target: (this.OgiReadys * 2),
				}),
			],
		}))
	}
}
