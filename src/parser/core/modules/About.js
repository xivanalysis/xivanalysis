import React from 'react'
import {Message} from 'semantic-ui-react'

import Module, {DISPLAY_ORDER} from 'parser/core/Module'

export default class About extends Module {
	static displayOrder = DISPLAY_ORDER.ABOUT
	name = 'About'

	output() {
		return <Message
			warning
			icon="warning sign"
			header="This job is currently unsupported"
			content="The output shown below will not contain any job-specific analysis, and may be missing critical data required to generate an accurate result."
		/>
	}
}
