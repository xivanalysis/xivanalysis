import {t} from '@lingui/macro'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import CastTime from 'parser/core/modules/CastTime'
import {Data} from 'parser/core/modules/Data'

export default class Inspiration extends Analyser {
	static override handle = 'inspiration'
	static override title = t('pct.inspiration.title')`Inspiration`

	@dependency private data!: Data
	@dependency private castTime!: CastTime

	private castTimeIndex: number | null = null

	override initialise() {
		const inspirationFilter = filter<Event>()
			.source(this.parser.actor.id)
			.status(this.data.statuses.INSPIRATION.id)
		this.addEventHook(inspirationFilter.type('statusApply'), this.onGain)
		this.addEventHook(inspirationFilter.type('statusRemove'), this.onDrop)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	// Heavily simplified version of Ley Lines, since this doesn't seem to have the paired status effects that tell you whether you're actually
	// Getting the bonus or not. Given the size of the landscape, this shouldn't be as much of a problem compared to Ley Lines
	private onGain() {
		this.castTimeIndex = this.castTime.setPercentageAdjustment('all', this.data.statuses.INSPIRATION.speedModifier, 'both')
	}

	private onDrop() {
		this.stopAndSave()
	}

	// We died, close windows
	private onDeath() {
		this.stopAndSave()
	}

	// Finalise a buff window
	private stopAndSave() {
		this.castTime.reset(this.castTimeIndex)
		this.castTimeIndex = null
	}

	private onComplete() {
		// Current time will be end of fight so no need to pass it here
		this.stopAndSave()
	}
}
