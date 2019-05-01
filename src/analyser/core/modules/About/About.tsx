import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DisplayOrder} from 'analyser/core/DisplayOrder'
import {DisplayMode, Module} from 'analyser/Module'
import ContributorLabel from 'components/ui/ContributorLabel'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {patchSupported} from 'data/PATCHES'
import React from 'react'
import {Grid, Icon, Message, Segment} from 'semantic-ui-react'
import styles from './About.module.css'

export class About extends Module {
	static handle = 'about'
	static title = t('core.about.title')`About`
	static displayMode = DisplayMode.FULL
	static displayOrder = DisplayOrder.ABOUT

	output() {
		const {
			Description,
			supportedPatches,
			contributors,
		} = this.analyser.meta

		// TODO: Look into a better metric to trigger unsupported on - what if
		// a non-job module group merges some supported patch info in?
		if (!supportedPatches) {
			return (
				<Message warning icon>
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
			)
		}

		// Work out the supported patch range (and if we're in it)
		const {from, to} = supportedPatches
		const supported = patchSupported(
			this.analyser.gameEdition,
			from,
			to,
			this.analyser.startTime,
		)

		const mobileWidth = 16
		const contentWidth = 10
		const metaWidth = 6
		return <Grid>
			<Grid.Column mobile={mobileWidth} computer={contentWidth}>
				{Description && <Description/>}

				{!supported && (
					<Message error icon>
						<Icon name="times circle outline"/>
						<Message.Content>
							<Message.Header>
								<Trans id="core.about.patch-unsupported.title">Report patch unsupported</Trans>
							</Message.Header>
							<Trans id="core.about.patch-unsupported.description">
								This report was logged during patch {this.analyser.patch.key}, which is not supported by the analyser. Calculations and suggestions may be impacted by changes in the interim.
							</Trans>
						</Message.Content>
					</Message>
				)}
			</Grid.Column>

			{/* Meta box */}
			{/* TODO: This looks abysmal */}
			<Grid.Column mobile={mobileWidth} computer={metaWidth}>
				<Segment as="dl" className={styles.meta}>
					<dt><Trans id="core.about.supported-patches">Supported Patches:</Trans></dt>
					<dd>{from}{from !== to && `–${to}`}</dd>

					{contributors && contributors.length > 0 && <>
						<dt><Trans id="core.about.contributors">Contributors:</Trans></dt>
						<dd>
							{contributors.map(contributor => {
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
