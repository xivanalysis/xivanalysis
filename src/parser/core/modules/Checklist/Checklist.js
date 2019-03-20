import {t} from '@lingui/macro'
import React from 'react'

import Rule from './Rule'
import ChecklistComponent from './Component'
import Module, {DISPLAY_MODE} from 'parser/core/Module'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

export default class Checklist extends Module {
	static handle = 'checklist'
	static title = t('core.checklist.title')`Checklist`
	static displayOrder = DISPLAY_ORDER.CHECKLIST
	static displayMode = DISPLAY_MODE.FULL

	_rules = []

	add(rule) {
		if (!(rule instanceof Rule)) {
			console.error('TODO: This error message')
			return
		}

		this._rules.push(rule)
	}

	output() {
		const sortedRules = [...this._rules]
		sortedRules.sort((a, b) => a.displayOrder - b.displayOrder)
		return <ChecklistComponent rules={sortedRules}/>
	}
}
