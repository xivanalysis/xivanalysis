import React from 'react'

import Module, {DISPLAY_ORDER} from 'parser/core/Module'

export default class About extends Module {
	static displayOrder = DISPLAY_ORDER.ABOUT
	name = 'About'

	output() {
		return <p>This isn&apos;t even remotely done.</p>
	}
}
