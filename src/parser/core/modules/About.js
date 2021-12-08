import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Message, Segment} from 'akkd'
import ContributorLabel from 'components/ui/ContributorLabel'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {patchSupported} from 'data/PATCHES'
import {Analyser, DisplayMode} from 'parser/core/Analyser'
import React from 'react'
import {Header} from 'semantic-ui-react'
import styles from './About.module.css'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class About extends Analyser {
	static handle = 'about'
	static displayOrder = DISPLAY_ORDER.ABOUT
	static displayMode = DisplayMode.RAW
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
		if (this.supportedPatches == null) {
			return (
				<Segment>
					<Message error icon="times circle outline">
						<Message.Header>
							<Trans id="core.about.unsupported.title">This job is currently unsupported</Trans>
						</Message.Header>
						<Trans id="core.about.unsupported.description">
							The output shown below will not contain any job-specific analysis, and may be missing critical data required to generate an accurate result.
						</Trans>
					</Message>
				</Segment>
			)
		}

		// Work out the supported patch range (and if we're in it)
		const {from, to = from} = this.supportedPatches
		const supported = patchSupported(
			this.parser.report.edition,
			from,
			to,
			this.parser.pull.timestamp / 1000,
		)

		const {Description} = this

		return (
			<div className={styles.container}>
				<div className={styles.description}>
					<Header><NormalisedMessage message={this.constructor.title}/></Header>

					<Description/>

					{!supported && (
						<Message error icon="times circle outline">
							<Message.Header>
								<Trans id="core.about.patch-unsupported.title">Report patch unsupported</Trans>
							</Message.Header>
							<Trans id="core.about.patch-unsupported.description">
								This report was logged during patch {this.parser.patch.key}, which is not supported by the analyser. Calculations and suggestions may be impacted by changes in the interim.
							</Trans>
						</Message>
					)}
				</div>

				<dl className={styles.meta}>
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
				</dl>
			</div>
		)
	}
}
