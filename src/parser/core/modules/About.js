import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Grid, Message, Icon, Segment} from 'semantic-ui-react'

import ContributorLabel from 'components/ui/ContributorLabel'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {patchSupported, languageToEdition} from 'data/PATCHES'
import Module, {DISPLAY_MODE} from 'parser/core/Module'
import DISPLAY_ORDER from './DISPLAY_ORDER'

import styles from './About.module.css'

export default class About extends Module {
	static handle = 'about'
	static displayOrder = DISPLAY_ORDER.ABOUT
	static displayMode = DISPLAY_MODE.FULL
	static title = t('core.about.title')`About`

	Description = null
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
		const fields = ['Description', 'contributors', 'supportedPatches']
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
		const supported = patchSupported(
			languageToEdition(this.parser.report.lang),
			from,
			to,
			this.parser.parseDate,
		)

		return <Grid>
			<Grid.Column mobile={16} computer={10}>
				<this.Description/>
				{!supported && <Message error icon>
					<Icon name="times circle outline"/>
					<Message.Content>
						<Message.Header>
							<Trans id="core.about.patch-unsupported.title">Report patch unsupported</Trans>
						</Message.Header>
						<Trans id="core.about.patch-unsupported.description">
							This report was logged during patch {this.parser.patch.key}, which is not supported by the analyser. Calculations and suggestions may be impacted by changes in the interim.
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
										detail={role && <NormalisedMessage message={role.text}/>}
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
