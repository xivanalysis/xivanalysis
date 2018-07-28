import React, {Fragment} from 'react'
import {Grid, Message, Segment} from 'semantic-ui-react'

import ContributorLabel from 'components/ui/ContributorLabel'
import Module, {DISPLAY_ORDER} from 'parser/core/Module'

import {Trans} from '@lingui/react'

import styles from './About.module.css'

export default class About extends Module {
	static handle = 'about'
	static displayOrder = DISPLAY_ORDER.ABOUT

	description = null
	supportedPatch = null
	contributors = []

	output() {
		// If this passes, we've not been subclassed. Render an error.
		if (Object.getPrototypeOf(this) === About.prototype) {
			return <Message warning icon="warning sign">
				<Message.Content>
					<Message.Header>
						<Trans id="core.about.unsupported.title">This job is currently unsupported</Trans>
					</Message.Header>
					<Trans id="core.about.unsupported.description">
						The output shown below will not contain any job-specific analysis, and may be missing critical data required to generate an accurate result.
					</Trans>
				</Message.Content>
			</Message>
		}

		return <Grid>
			<Grid.Column mobile={16} computer={10}>
				{this.description}
			</Grid.Column>

			{/* Meta box */}
			{/* TODO: This looks abysmal */}
			<Grid.Column mobile={16} computer={6}>
				<Segment as="dl" className={styles.meta}>
					{this.supportedPatch && <Fragment>
						<dt><Trans id="core.about.updated-for">Updated For:</Trans></dt>
						<dd><Trans id="core.about.patch">Patch {this.supportedPatch}</Trans></dd>
					</Fragment>}

					{this.contributors.length > 0 && <Fragment>
						<dt><Trans id="core.about.contributors">Contributors:</Trans></dt>
						<dd>
							{this.contributors.map(contributor => {
								const {user, role} = contributor
								return <div
									key={typeof user === 'string' ? user : user.name}
									className={styles.contributor}
								>
									<ContributorLabel
										contributor={user}
										detail={<Trans id={role.id} defaults={role.text} />}
									/>
								</div>
							})}
						</dd>
					</Fragment>}
				</Segment>
			</Grid.Column>
		</Grid>
	}
}
