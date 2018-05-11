// import moment from 'moment'
import React from 'react'
import VisTimeline from 'react-visjs-timeline'
import vis from 'vis/dist/vis-timeline-graph2d.min'

import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'

import styles from './Timeline.module.css'

export default class Timeline extends Module {
	static displayOrder = -100
	static dependencies = [
		'cooldowns',
		'invuln'
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
		// TODO: This is going to get pretty big if I let it... and there's potential for
		//       job-specific info that could be good on the timeline
		//       Might be worth moving this into a format akin to checklist/suggestions
		//       ... how would I do styling for that?

		const items = []

		var startTime = this.parser.fight.start_time

		// Cooldown cooldowns
		this.cooldowns.used.forEach(actionId => {
			const action = getAction(actionId)
			items.push(...this.cooldowns.getCooldown({id: actionId}).history.map(use => ({
				type: 'background',
				start: use.timestamp - startTime,
				end: use.timestamp + use.length - startTime,
				group: actionId,
				content: `<img src="${action.icon}" alt="${action.name}">`,
				className: styles.cooldown
			})))
		})

		// All-target invuln periods
		this.invuln.getInvulns().forEach(invuln => {
			items.push({
				type: 'background',
				start: invuln.start - startTime,
				end: invuln.end - startTime,
				className: styles[invuln.type]
			})
		})

		return items
	}

	output() {
		const options = {
			// General styling
			width: '100%',
			align: 'left',
			stack: false,
			showCurrentTime: false,

			// Date/time formatting
			moment: (date) => vis.moment(date).utc(),
			maxMinorChars: 4,
			format: {
				minorLabels: {
					minute: 'm[m]'
				},
				majorLabels: {
					second: 'm[m]',
					minute: ''
				}
			},

			// View constraints
			min: 0,
			max: this.parser.fightDuration,
			zoomMin: 10000,

			// View defaults
			// Show first minute by default, full fight view is a bit hard to grok.
			start: 0,
			end: Math.min(this.parser.fightDuration, 60000)
		}

		return <VisTimeline
			options={options}
			groups={this.getGroups()}
			items={this.getItems()}
		/>
	}
}
