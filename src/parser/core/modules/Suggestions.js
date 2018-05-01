import React from 'react'
import { Item } from 'semantic-ui-react'

import ACTIONS from 'data/ACTIONS'
import Module, { DISPLAY_ORDER } from 'parser/core/Module'

export default class Suggestions extends Module {
	static displayOrder = DISPLAY_ORDER.SUGGESTIONS

	output() {
		return <Item.Group>
			<Item
				image={{size: 'mini', src: ACTIONS.RUIN_III.icon}}
				header="Header"
				meta="Meta"
				description="Description"
				extra="Extra details"
			/>
		</Item.Group>
	}
}
