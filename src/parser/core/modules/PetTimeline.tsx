import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'
import Timeline, {Group, Item} from 'parser/core/modules/Timeline'
import React from 'react'

// This module puts pet skills on the timeline beneath the GCD spells
export default class PetTimeline extends Module {
	static handle = 'pettimeline'

	@dependency private data!: Data
	@dependency private timeline!: Timeline

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

	private petContainerGroupId = 'pet'
	private petAutoGroupId = 'petauto'
	private petCommandGroupId = 'petcommand'
	private autoCasts: CastEvent[] = []
	private commandCasts: CastEvent[] = []

	protected isCommandedEvent(event: CastEvent) {
		return false
	}

	protected init() {
		this.addEventHook('cast', {by: 'pet'}, this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		if (this.isCommandedEvent(event)) {
			this.commandCasts.push(event)
		} else {
			this.autoCasts.push(event)
		}
	}

	private onComplete() {
		if (this.canPetBeCommanded) {
			this.timeline.addGroup(new Group({
				id: this.petContainerGroupId,
				content: this.timelineGroupName,
				order: -100,
			}))
			this.timeline.attachToGroup(this.petContainerGroupId,
				new Group({
					id: this.petAutoGroupId,
					content: this.timelineAutosName,
					order: 1,
				}))
			this.timeline.attachToGroup(this.petContainerGroupId,
				new Group({
					id: this.petCommandGroupId,
					content: this.timelineCommandsName,
					order: 2,
				}))

			this.addCastsToGroup(this.petCommandGroupId, this.commandCasts)
		} else {
			if (this.timelineSummonAction != null) {
				this.timeline.attachToGroup(this.timelineSummonAction,
				new Group({
					id: this.petAutoGroupId,
					content: this.timelineGroupName,
					order: -100,
				}))
			} else {
				this.timeline.addGroup(new Group({
					id: this.petAutoGroupId,
					content: this.timelineGroupName,
					order: -100,
				}))
			}
		}

		this.addCastsToGroup(this.petAutoGroupId, this.autoCasts)
	}

	private addCastsToGroup(groupId: string, casts: CastEvent[]) {
		casts.forEach(a => {
			const action = this.data.getAction(a.ability.guid)
			if (!action) { return }
			this.timeline.addItem(new Item({
				type: 'background',
				start: a.timestamp - this.parser.fight.start_time,
				length: 0,
				title: action.name,
				group: groupId,
				content: <img src={action.icon} alt={action.name} title={action.name} />,
			}))
		})
	}
}
