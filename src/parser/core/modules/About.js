import React, {Fragment} from 'react'
import {Label, Message} from 'semantic-ui-react'

import Module, {DISPLAY_ORDER} from 'parser/core/Module'

export default class About extends Module {
	static handle = 'about'
	static displayOrder = DISPLAY_ORDER.ABOUT

	output() {
		// If this passes, we've not been subclassed. Render an error.
		if (Object.getPrototypeOf(this) === About.prototype) {
			return <Message
				warning
				icon="warning sign"
				header="This job is currently unsupported"
				content="The output shown below will not contain any job-specific analysis, and may be missing critical data required to generate an accurate result."
			/>
		}

		return <Fragment>
			{this.getDescription()}

			{this.getContributors().map(contributor => <Label
				key={contributor.user}
				content={contributor.user}
				detail={contributor.role}
			/>)}
		</Fragment>
	}

	getDescription() {
		return null
	}

	getContributors() {
		return []
	}
}
