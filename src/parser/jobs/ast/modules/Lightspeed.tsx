import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import CastTime from 'parser/core/modules/CastTime'
import {Data} from 'parser/core/modules/Data'

const LIGHTSPEED_REDUCTION = -2500

// in this module we only want to track Lightspeed windows for castTime/weaving purposes
export class Lightspeed extends Analyser {
	static override handle = 'Lightspeed'

	@dependency private data!: Data
	@dependency private castTime!: CastTime

	private castedTime: number | undefined = undefined //when lightspeed was casted
	private castTimeIndex: number | null = null

	override initialise() {
		const lightspeedFilter = filter<Event>().status(this.data.statuses.LIGHTSPEED.id)

		this.addEventHook(lightspeedFilter.type('statusApply')
			.target(this.parser.actor.id), this.tryOpenWindow)
		this.addEventHook(lightspeedFilter.type('statusRemove')
			.target(this.parser.actor.id), this.tryCloseWindow)
	}

	private tryOpenWindow(event: Events['statusApply']) {
		if (this.castedTime === undefined) {
			this.castedTime = event.timestamp
			this.castTimeIndex = this.castTime.setTimeAdjustment('all', LIGHTSPEED_REDUCTION)
		}
	}

	private tryCloseWindow() {
		if (this.castedTime == null) { return }

		// Make sure all applicable statuses have fallen off before the window closes
		this.castedTime = undefined
		this.castTime.reset(this.castTimeIndex)
		this.castTimeIndex = null
	}
}
