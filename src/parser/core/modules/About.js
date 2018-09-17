import {Trans, i18nMark} from '@lingui/react'
import _ from 'lodash'
import React from 'react'
import {Grid, Message, Icon, Segment} from 'semantic-ui-react'

import ContributorLabel from 'components/ui/ContributorLabel'
import PATCHES, {getPatch} from 'data/PATCHES'
import Module from 'parser/core/Module'
import DISPLAY_ORDER from './DISPLAY_ORDER'

import styles from './About.module.css'

export default class About extends Module {
	static handle = 'about'
	static displayOrder = DISPLAY_ORDER.ABOUT
	static i18n_id = i18nMark('core.about.title')

	description = null
	contributors = []

	supportedPatches = {
		// from: ...,
		// to: ...,
	}

	set supportedPatch(value) {
		// Warn the dev that they're using a deprecated prop
		if (process.env.NODE_ENV === 'development') {
			console.warn('About.suportedPatch has been deprecated. Please use the About.supportedPatches object instead.')
		}

		this.supportedPatches.from = value
	}

	output() {
		// If this passes, we've not been subclassed. Render an error.
		if (Object.getPrototypeOf(this) === About.prototype) {
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
		let supported = false
		const {from, to = from} = this.supportedPatches
		if (from && PATCHES[from]) {
			// Work out what the next patch is - if there is none, next patch "never" comes (until we add it!)
			const sortedPatches = Object.keys(PATCHES).sort(
				(a, b) => PATCHES[a].date - PATCHES[b].date
			)
			const nextPatchKey = sortedPatches[sortedPatches.indexOf(to) + 1]
			const nextPatch = PATCHES[nextPatchKey] || {date: Infinity}

			// Grab the dates for the from/to
			const fromDate = PATCHES[from].date
			const toDate = nextPatch.date

			supported = _.inRange(this.parser.parseDate, fromDate, toDate)
		}

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
					<dd>{from || 'Unsupported'}{from !== to && `–${to}`}</dd>

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
