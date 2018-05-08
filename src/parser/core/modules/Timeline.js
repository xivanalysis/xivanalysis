import moment from 'moment'
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
		this.cooldowns.used.forEach(actionId => {
			items.push(...this.cooldowns.getCooldown({id: actionId}).history.map(use => ({
				type: 'background',
				start: use.timestamp - this.parser.fight.start_time,
				end: use.timestamp + use.length - this.parser.fight.start_time,
				group: actionId
			})))
		})
		return items
	}

	output() {
		const options = {
			width: '100%',
			align: 'left',
			stack: false,

			moment: (date) => moment(date).utc(),
			min: 0,
			max: this.parser.fightDuration,
			start: 0,
			end: this.parser.fightDuration,
			zoomMin: 10000
		}

		return <VisTimeline
			options={options}
			groups={this.getGroups()}
			items={this.getItems()}
		/>
	}
}
