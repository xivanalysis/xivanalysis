import {Trans, i18nMark} from '@lingui/react'
import React from 'react'
import VisTimeline from 'react-visjs-timeline'
import vis from 'vis/dist/vis-timeline-graph2d.min'

import Module, {DISPLAY_ORDER} from 'parser/core/Module'

import styles from './Timeline.module.css'

// We default to showing the first minute of the pull
const ONE_MINUTE = 60000

export default class Timeline extends Module {
	static handle = 'timeline'
	static displayOrder = DISPLAY_ORDER.BOTTOM

	static i18n_id = i18nMark('core.timeline.title')
	static title  = 'Timeline'

	_groups = []
	_items = []

	// TODO: Do more with these, it's pretty bad rn
	addGroup(group) {
		this._groups.push(group)
	}

	addItem(item) {
		this._items.push(item)
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

		return <>
			<Trans id="core.timeline.help-text" render="span" className={styles.helpText}>
				Scroll or click+drag to pan, ctrl+scroll or pinch to zoom.
			</Trans>
			<VisTimeline
				options={options}
				groups={this._groups.map(group => group.getObject())}
				items={this._items.map(item => item.getObject())}
			/>
		</>
	}
}
