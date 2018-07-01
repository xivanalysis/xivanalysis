import React from 'react'

import Rule from './Rule'
import ChecklistComponent from 'components/modules/Checklist'
import Module, {DISPLAY_ORDER} from 'parser/core/Module'

export default class Checklist extends Module {
	static displayOrder = DISPLAY_ORDER.CHECKLIST
	name = 'Checklist'

	_rules = []

	add(rule) {
		if (!(rule instanceof Rule)) {
			console.error('TODO: This error message')
			return
		}

		this._rules.push(rule)
	}

	output() {
		return <ChecklistComponent rules={this._rules}/>
	}
}
