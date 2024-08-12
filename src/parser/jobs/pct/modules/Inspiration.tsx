import {t} from '@lingui/macro'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import CastTime from 'parser/core/modules/CastTime'
import {Data} from 'parser/core/modules/Data'
import {HYPERPHANTASIA_SPELLS} from './CommonData'

export class Inspiration extends Analyser {
	static override handle = 'inspiration'
	static override title = t('pct.inspiration.title')`Inspiration`

	@dependency private data!: Data
	@dependency private castTime!: CastTime

	private castTimeIndex: number | null = null

	private hyperphantasiaSpellIds = HYPERPHANTASIA_SPELLS.map(key => this.data.actions[key].id)

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

	// Heavily simplified version of Ley Lines, since this doesn't affect all casts, only the Hyperphantasia consumers
	// It  works the same as Circle of Power where Inspiration is only applied while in the buff area, and it falls off
	// once all 5 stacks of Hyperphantasia are consumed
	private onGain() {
		// Inspiration can be re-applied multiple times during the window it is active - avoid stacking.
		if (this.castTimeIndex != null) {
			return
		}

		this.castTimeIndex = this.castTime.setPercentageAdjustment(this.hyperphantasiaSpellIds, this.data.statuses.INSPIRATION.speedModifier, 'both')
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
