import {t} from '@lingui/macro'
import {DisplayOrder} from 'analyser/core/DisplayOrder'
import {DisplayMode, Module} from 'analyser/Module'
import React from 'react'
import VisTimeline from 'react-visjs-timeline'
import {Group} from './Group'
import {Item} from './Item'
import {getOptions} from './options'

export class Timeline extends Module {
	static handle = 'timeline'
	static title = t('core.timeline.title')`Timeline`
	static displayOrder = DisplayOrder.TIMELINE
	static displayMode = DisplayMode.FULL

	private items: Item[] = []
	private groups: Group[] = []

	/**
	 * Add an element to the timeline.
	 * Adding a group will add a new group lane, containing the group's items.
	 * Adding an item will add it globally.
	 */
	add(element: Item | Group) {
		if (element instanceof Item) {
			this.items.push(element)
		} else if (element instanceof Group) {
			this.groups.push(element)
		} else {
			throw new Error('Elements added to the timeline should extend from Item or Group.')
		}
	}

	output() {
		const options = getOptions(this.analyser.fightDuration)

		const items = this.items.map(
			(item, index) => this.itemToVis(`global|${index}`, item),
		)

		const groups: vis.TimelineGroup[] = []
		this.groups.forEach((group, groupIndex) => {
			groups.push({
				id: groupIndex,
				content: group.name,
			})

			items.push(...group.items.map((item, itemIndex) => ({
				...this.itemToVis(`${groupIndex}|${itemIndex}`, item),
				group: groupIndex,
			})))
		})

		return <>
			<VisTimeline
				options={options}
				items={items}
				groups={groups}
			/>
		</>
	}

	private itemToVis(id: vis.IdType, item: Item): vis.TimelineItem {
		return {
			type: 'background',
			content: `<img src="${item.icon}">`,
			id,
			start: this.analyser.relativeTimestamp(item.timestamp),
			end: this.analyser.relativeTimestamp(item.timestamp + item.duration),
		}
	}
}
