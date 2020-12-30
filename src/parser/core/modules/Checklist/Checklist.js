import {t} from '@lingui/macro'
import React from 'react'

import Rule from './Rule'
import ChecklistComponent from './Component'
import {Analyser, DisplayMode} from 'parser/core/Analyser'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

export default class Checklist extends Analyser {
	static handle = 'checklist'
	static title = t('core.checklist.title')`Checklist`
	static displayOrder = DISPLAY_ORDER.CHECKLIST
	static displayMode = DisplayMode.FULL

	_rules = []

	add(rule) {
		if (!(rule instanceof Rule)) {
			throw new Error('Invalid rule provided to checklist.')
		}

		this._rules.push(rule)
	}

	output() {
		const sortedRules = [...this._rules]
		sortedRules.sort((a, b) => a.displayOrder - b.displayOrder)
		return <ChecklistComponent rules={sortedRules}/>
	}
}
