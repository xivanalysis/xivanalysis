import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'

const HARPE_CDR = 5000 //Harpe cast under Enhanced Harpe status reduced recast of Ingress/Engress by 5s
export class Harpe extends CoreProcs {
	static override handle = 'harpe'
	@dependency private cooldowns!: Cooldowns

	override showProcTimelineRow = false

	override initialise(): void {
		super.initialise()

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
				.action(this.data.actions.HARPE.id),
			this.checkHarpeCast,
		)
	}

	trackedProcs = [
		{
			procStatus: this.data.statuses.ENHANCED_HARPE,
			consumeActions: [this.data.actions.HARPE],
		},

	]

	private checkHarpeCast(event: Events['action']): void {
		if (super.checkEventWasProc(event)) {
			this.cooldowns.reduce('HELLS_INGRESS', HARPE_CDR) //They share a CD, does not matter which one we reduce
		}
	}

}
