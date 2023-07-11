import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// Triple Trident can be loosely considered as the last step in a combo;
// you always want to pop
//
//  Whistle => Tingle => Triple Trident
//
// Although in standard BLU fashion, the first two buttons can be
// in any order, and you can use any amount of non-Physical attacks
// after the first two and still get the combo.

export class TripleTrident extends Analyser {
	static override handle = 'tripletrident'

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private unbuffedTT = 0
	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.TRIPLE_TRIDENT.id), this.onTripleTrident)
		this.addEventHook('complete', this.onComplete)
	}

	private onTripleTrident() {
		const hasWhistle = this.actors.current.hasStatus(this.data.statuses.WHISTLE.id)
		const hasTingle = this.actors.current.hasStatus(this.data.statuses.TINGLING.id)
		if (hasWhistle && hasTingle) {
			return
		}
		this.unbuffedTT++
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.TRIPLE_TRIDENT.icon,
			content: <Trans id="blu.triple_trident.unbuffed.content">
				<DataLink action="TRIPLE_TRIDENT" /> should always be buffed with <DataLink action="WHISTLE" /> and <DataLink action="TINGLE" />. For <DataLink action="MOON_FLUTE" showIcon={false} /> windows, you want to cast <DataLink action="WHISTLE" showIcon={false} /> and <DataLink action="TINGLE" showIcon={false} /> before casting <DataLink action="MOON_FLUTE" showIcon={false} />.
			</Trans>,
			tiers: {1: SEVERITY.MEDIUM},
			value: this.unbuffedTT,
			why: <Trans id="blu.triple_trident.unbuffed.why">
				<Plural value={this.unbuffedTT} one="# Triple Trident use" other="# Triple Trident uses" /> were not buffed
			</Trans>,
		}))
	}
}

