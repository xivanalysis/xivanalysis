import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Timeline, {Group, Item} from 'parser/core/modules/Timeline'
import React from 'react'

// This module puts pet skills on the timeline beneath the GCD spells
export default class PetTimeline extends Module {
	static handle = 'pettimeline'

	@dependency private timeline!: Timeline

	private petContainerGroupId = 'pet'
	private petAutoGroupId = 'petauto'
	private petCommandGroupId = 'petcommand'
	private autoCasts: CastEvent[] = []
	private commandCasts: CastEvent[] = []

	protected canPetBeCommanded() {
		return false
	}

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
		if (this.canPetBeCommanded()) {
			this.timeline.addGroup(new Group({
				id: this.petContainerGroupId,
				content: 'Pet',
				order: -100,
			}))
			this.timeline.attachToGroup(this.petContainerGroupId,
				new Group({
					id: this.petAutoGroupId,
					content: 'Autos',
					order: 1,
				}))
			this.timeline.attachToGroup(this.petContainerGroupId,
				new Group({
					id: this.petCommandGroupId,
					content: 'Commands',
					order: 2,
				}))

			this.addCastsToGroup(this.petCommandGroupId, this.commandCasts)
		} else {
			this.timeline.addGroup(new Group({
				id: this.petAutoGroupId,
				content: 'Pet',
				order: -100,
			}))
		}

		this.addCastsToGroup(this.petAutoGroupId, this.autoCasts)
	}

	private addCastsToGroup(groupId: string, casts: CastEvent[]) {
		casts.forEach(a => {
			const action = getDataBy(ACTIONS, 'id', a.ability.guid)
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
