import React, {Fragment} from 'react'
import {Message} from 'semantic-ui-react'

import ContributorLabel from 'components/ui/ContributorLabel'
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

			{this.getContributors().map(contributor => {
				const user = contributor.user
				return <ContributorLabel
					key={typeof user === 'string'? user : user.name}
					contributor={user}
					detail={contributor.role}
				/>
			})}
		</Fragment>
	}

	getDescription() {
		return null
	}

	getContributors() {
		return []
	}
}
