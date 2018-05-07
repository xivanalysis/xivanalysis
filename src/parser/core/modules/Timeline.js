import React from 'react'
import VisTimeline from 'react-visjs-timeline'

import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'

export default class Timeline extends Module {
	static displayOrder = -100
	static dependencies = [
		'cooldowns'
	]
	name = 'Timeline'

	getGroups() {
		// TODO: Nicer access?
		return this.cooldowns.used.map(actionId => ({
			id: actionId,
			content: getAction(actionId).name
		}))
	}

	getItems() {
		const items = []
		this.cooldowns.used.map(actionId => {
			items.push(...this.cooldowns.getHistory(actionId).map(use => ({
				start: use.timestamp,
				group: actionId
			})))
		})
		return items
	}

	output() {
		const options = {
			width: '100%'
		}

		return <VisTimeline
			options={options}
			groups={this.getGroups()}
			items={this.getItems()}
		/>
	}
}
