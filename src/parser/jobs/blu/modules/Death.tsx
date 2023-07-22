import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actor} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {ActorDeathInfo, Death} from 'parser/core/modules/Death'
import React from 'react'

// Deaths from Final Sting and Self-Destruct should not count for
// the report.
// It would be nice to check for early stings here, but that would
// require comparing how much damage the sting did vs how much health
// the boss had left, which is too fight-specific.

export class BLUDeath extends Death {
	@dependency private mydata!: Data

	private isFinalSting = false

	override initialise() {
		super.initialise()
		this.addEventHook(filter<Event>().source(this.parser.actor.id).type('action')
			.action(oneOf([
				this.mydata.actions.FINAL_STING.id,
				this.mydata.actions.SELF_DESTRUCT.id,
			])), this.onFinalSting)
	}

	private actorStings: Map<Actor['id'], number> = new Map<Actor['id'], number>()
	private onFinalSting(event: Events['action']) {
		const stingerId = event.source
		this.actorStings.set(stingerId, (this.actorStings.get(stingerId) ?? 0) + 1)
		this.isFinalSting = true
	}

	override shouldCountDeath(event: Events['actorUpdate']): boolean {
		if (event.actor !== this.parser.actor.id) {
			return true
		}
		if (this.isFinalSting) {
			this.isFinalSting = false
			return false
		}
		return true
	}

	override deathSuggestionWhy(actorId: Actor['id'], playerInfo: ActorDeathInfo): JSX.Element {
		const actorStings = this.actorStings.get(actorId) ?? 0
		if (actorStings === 0) {
			return super.deathSuggestionWhy(actorId, playerInfo)
		}

		return <Trans id="blu.deaths.why">
			<Plural id="blu.deaths.why.death_count"
				value={playerInfo.count}
				_1="# death"
				other="# deaths"
			/>, not counting <Plural id="blu.deaths.why.final_stings"
				value={actorStings}
				_1="# death"
				other="# deaths"
			/> from using <DataLink action="FINAL_STING" showIcon={false} />.
		</Trans>
	}
}

