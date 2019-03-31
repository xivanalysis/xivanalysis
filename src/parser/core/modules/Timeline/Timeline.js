import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import VisTimeline from 'react-visjs-timeline'
import vis from 'vis/dist/vis-timeline-graph2d.min'

import Module, {DISPLAY_MODE} from 'parser/core/Module'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

import styles from './Timeline.module.css'

// We default to showing the first minute of the pull
const ONE_MINUTE = 60000

export default class Timeline extends Module {
	static handle = 'timeline'
	static displayOrder = DISPLAY_ORDER.TIMELINE
	static displayMode = DISPLAY_MODE.FULL

	static title = t('core.timeline.title')`Timeline`

	// Data to be displayed on the timeline
	_groups = []
	_items = []

	// Ref for the timeline component so we can modify it post-render
	_ref = null

	constructor(...args) {
		super(...args)

		this._ref = React.createRef()

		this.addGroup = this.addGroup.bind(this)
		this.addItem = this.addItem.bind(this)
		this.show = this.show.bind(this)
	}

	// TODO: Do more with these, it's pretty bad rn
	addGroup(group) {
		this._groups.push(group)
	}

	addItem(item) {
		this._items.push(item)
	}

	/**
	 * Move & zoom the viewport to show the specified range
	 * @param {number} start - Timestamp of the start of the range
	 * @param {number} end - Timestamp of the end of the range
	 * @param {boolean} [scrollTo=true] - If true, the page will scroll to reveal the timeline on call.
	 */
	show(start, end, scrollTo=true) {
		// Grab the vis instance. This is a bit hacky but so is vis so /shrug
		const vis = this._ref.current.$el
		vis.setWindow(start, end)

		// If not disabled, scroll the page to us
		if (scrollTo) {
			this.parser.scrollTo(this.constructor.handle)
		}
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
					minute: 'm[m]',
				},
				majorLabels: {
					second: 'm[m]',
					minute: '',
				},
			},

			// View constraints
			min: 0,
			max: this.parser.fightDuration,
			zoomMin: 10000,

			// View defaults
			// Show first minute by default, full fight view is a bit hard to grok.
			start: 0,
			end: Math.min(this.parser.fightDuration, ONE_MINUTE),

			// Zoom key handling
			zoomKey: 'ctrlKey',
			horizontalScroll: true,
		}

		let items = this._items
		const groups = this._groups.map(group => {
			if (group.items) {
				items = items.concat(group.items)
			}
			return group.getObject()
		})

		return <>
			<Trans id="core.timeline.help-text" render="span" className={styles.helpText}>
				Scroll or click+drag to pan, ctrl+scroll or pinch to zoom.
			</Trans>
			<VisTimeline
				ref={this._ref}
				options={options}
				groups={groups}
				items={items.map(item => item.getObject())}
			/>
		</>
	}
}
