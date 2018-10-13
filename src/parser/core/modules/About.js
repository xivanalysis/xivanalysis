import {Trans, i18nMark} from '@lingui/react'
import React from 'react'
import {Grid, Message, Icon, Segment} from 'semantic-ui-react'

import ContributorLabel from 'components/ui/ContributorLabel'
import {getPatch, patchSupported} from 'data/PATCHES'
import Module from 'parser/core/Module'
import DISPLAY_ORDER from './DISPLAY_ORDER'

import styles from './About.module.css'

export default class About extends Module {
	static handle = 'about'
	static displayOrder = DISPLAY_ORDER.ABOUT
	static i18n_id = i18nMark('core.about.title')

	description = null
	contributors = []

	supportedPatches = null
	// {
	//		from: ...,
	//		to: ...,
	// }

	set supportedPatch(value) {
		// Warn the dev that they're using a deprecated prop
		if (process.env.NODE_ENV === 'development') {
			console.warn('About.suportedPatch has been deprecated. Please use the About.supportedPatches object instead.')
		}

		this.supportedPatches.from = value
	}

	constructor(...args) {
		super(...args)

		// Merge the parser's metadata in
		const fields = ['description', 'contributors', 'supportedPatches']
		fields.forEach(field => {
			this[field] = this.parser.meta[field]
		})
	}

	output() {
		// If they've not set the supported patch range, we're assuming it's not supported at all
		if (!this.supportedPatches) {
			return <Message warning icon>
				<Icon name="warning sign" />
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

		// Work out the supported patch range (and if we're in it)
		const {from, to = from} = this.supportedPatches
		const supported = patchSupported(from, to, this.parser.parseDate)

		return <Grid>
			<Grid.Column mobile={16} computer={10}>
				{this.description}
				{!supported && <Message error icon>
					<Icon name="times circle outline"/>
					<Message.Content>
						<Message.Header>
							<Trans id="core.about.patch-unsupported.title">Report patch unsupported</Trans>
						</Message.Header>
						<Trans id="core.about.patch-unsupported.description">
							This report was logged during patch {getPatch(this.parser.parseDate)}, which is not supported by the analyser. Calculations and suggestions may be impacted by changes in the interim.
						</Trans>
					</Message.Content>
				</Message>}
			</Grid.Column>

			{/* Meta box */}
			{/* TODO: This looks abysmal */}
			<Grid.Column mobile={16} computer={6}>
				<Segment as="dl" className={styles.meta}>
					<dt><Trans id="core.about.supported-patches">Supported Patches:</Trans></dt>
					<dd>{from}{from !== to && `–${to}`}</dd>

					{this.contributors.length > 0 && <>
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
										detail={role && role.i18n_id ? <Trans id={role.i18n_id} defaults={role.text} /> : role}
									/>
								</div>
							})}
						</dd>
					</>}
				</Segment>
			</Grid.Column>
		</Grid>
	}
}
