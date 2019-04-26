import {t} from '@lingui/macro'
import {DisplayOrder} from 'analyser/core/DisplayOrder'
import {DisplayMode, Module} from 'analyser/Module'
import React from 'react'
import VisTimeline from 'react-visjs-timeline'
import {getOptions} from './options'

export class Timeline extends Module {
	static handle = 'timeline'
	static title = t('core.timeline.title')`Timeline`
	static displayOrder = DisplayOrder.TIMELINE
	static displayMode = DisplayMode.FULL

	output() {
		const options = getOptions(this.analyser.fightDuration)

		return <>
			<VisTimeline
				options={options}
			/>
		</>
	}
}
