import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {ActionTimeline} from 'parser/core/modules/ActionTimeline'
import {Data} from 'parser/core/modules/Data'
import {ActionItem, SimpleRow, Timeline} from 'parser/core/modules/Timeline'

// This module puts pet skills on the timeline beneath the GCD spells
export class PetTimeline extends Analyser {
	static override handle = 'pettimeline'

	@dependency protected data!: Data
	@dependency private timeline!: Timeline
	@dependency private actionTimeline!: ActionTimeline

	/**
	 * Implementing modules MAY change the timeline group name.
	 * If canPetBeCommanded returns false, this is the only name that will
	 * appear on the timeline.
	 */
	protected timelineGroupName = 'Pet'
	/**
	 * Implementing modules MAY indicate that a pet has a specific summon action.
	 * If canPetBeCommanded returns true, this field is not used.
	 * If timelineSummonAction is set to an action ID, actions will be grouped under it.
	 */
	// TODO: This should be transitioned to a stable action key type, rather than action ID
	protected timelineSummonAction?: number
	/**
	 * Implementing modules MAY change the timeline row name for pet autos.
	 * If canPetBeCommanded returns false, this field is not used.
	 */
	protected timelineAutosName = 'Autos'
	/**
	 * Implementing modules MAY change the timeline row name for pet commanded skills.
	 * If canPetBeCommanded returns false, this field is not used.
	 */
	protected timelineCommandsName = 'Commands'
	/**
	 * Implementing modules MAY indicate that a pet has both "autos" and "command" skills.
	 * If set to true, the autos and command skills will appear on separate lines in the
	 * timeline.  If set to false, all skills will appear on the same row.
	 *
	 * If this is set to true, also override isCommandedEvent to determine which events are
	 * command skills.
	 */
	protected canPetBeCommanded = false

	private autoCasts: Array<Events['action']> = []
	private commandCasts: Array<Events['action']> = []

	protected isCommandedEvent(_event: Events['action']): boolean {
		return false
	}

	override initialise() {
		const actorPets = this.parser.pull.actors
			.filter(actor => actor.owner != null && actor.owner.id === this.parser.actor.id)
			.map(pet => pet.id)
		this.addEventHook(filter<Event>().type('action').source(oneOf(actorPets)), this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['action']) {
		if (this.isCommandedEvent(event)) {
			this.commandCasts.push(event)
		} else {
			this.autoCasts.push(event)
		}
	}

	private onComplete() {
		let autoRow: SimpleRow

		if (this.canPetBeCommanded) {
			const parentrow = this.timeline.addRow(new SimpleRow({
				label: this.timelineGroupName,
				order: -98,
			}))

			autoRow = parentrow.addRow(new SimpleRow({
				label: this.timelineAutosName,
				order: 1,
			}))

			const commandRow = parentrow.addRow(new SimpleRow({
				label: this.timelineCommandsName,
				order: 2,
			}))

			this.addCastsToRow(commandRow, this.commandCasts)

		} else if (this.timelineSummonAction != null) {
			const summonAction = this.data.getAction(this.timelineSummonAction)
			if (summonAction == null) { throw new Error('Timeline summon action set to an invalid action ID') }

			const parentRow = this.actionTimeline.getRow(summonAction)

			autoRow = parentRow.addRow(new SimpleRow({
				label: this.timelineGroupName,
				order: -98,
			}))

		} else {
			autoRow = this.timeline.addRow(new SimpleRow({
				label: this.timelineGroupName,
				order: -98,
			}))
		}

		this.addCastsToRow(autoRow, this.autoCasts)
	}

	private addCastsToRow(row: SimpleRow, casts: Array<Events['action']>) {
		casts.forEach(cast => {
			const action = this.data.getAction(cast.action)
			if (action == null) { return }

			const start = cast.timestamp - this.parser.pull.timestamp
			row.addItem(new ActionItem({
				action,
				start,
				end: start, // zero length intentional
			}))
		})
	}
}
