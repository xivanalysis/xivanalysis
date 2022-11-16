import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Cause, Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SUGGESTION_TIERS = { // DK is 320, Bootshine is 210 without the buff, so you effective lost 110 * critcial hit modifers,  so it adds up fast.
	1: SEVERITY.MINOR, // minor loss
	2: SEVERITY.MEDIUM, // You've lost a full Bootshine and then some
	3: SEVERITY.MAJOR, // You've got a problem.
	// 4: SEVERITY.JUSTWHY Dear God man, use your hands!
}

export class DragonKick extends Analyser {
	static override handle = 'dragonkick'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private LeadBuffUp = false
	private overKicks = 0 // Amount of times they kicked over a buff

	override initialise(): void {
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('damage')
				.cause(filter<Cause>().action(this.data.actions.DRAGON_KICK.id)),
			this.onKick,
		)
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('statusRemove')
				.status(this.data.statuses.LEADEN_FIST.id),
			() => this.LeadBuffUp = false,
		)

		this.addEventHook('complete', this.onComplete)
	}

	private onKick() {
		if (this.LeadBuffUp === true) {
			this.overKicks++
		}
		this.LeadBuffUp = true
	}

	private onComplete(): void {

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DRAGON_KICK.icon,
			content: <Trans id="mnk.dragonkick.suggestions.overkick.content">
				Avoid using <DataLink action="DRAGON_KICK" /> while under the effect of <DataLink status="LEADEN_FIST"/>. Use <DataLink action="BOOTSHINE" /> instead.
			</Trans>,
			why: <Trans id="mnk.dragonkick.suggestions.overkick.why">
				You used <DataLink action="DRAGON_KICK" />  <Plural value={this.overKicks} one="# time" other="# times"/> while already having the <DataLink status="LEADEN_FIST"/> buff.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: this.overKicks,
		}))
	}
}
