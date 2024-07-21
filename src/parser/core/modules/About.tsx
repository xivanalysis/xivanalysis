import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Message, Segment} from 'akkd'
import ContributorLabel from 'components/ui/ContributorLabel'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {patchSupported} from 'data/PATCHES'
import {AVAILABLE_MODULES} from 'parser/AVAILABLE_MODULES'
import {Analyser, DisplayMode} from 'parser/core/Analyser'
import React from 'react'
import {Header} from 'semantic-ui-react'
import {dependency} from '../Injectable'
import {ContributorRole, SupportedPatches} from '../Meta'
import styles from './About.module.css'
import {Actors} from './Actors'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class About extends Analyser {
	static override handle = 'about'
	static override displayOrder = DISPLAY_ORDER.ABOUT
	static override displayMode = DisplayMode.RAW
	static override title = t('core.about.title')`About`

	@dependency private actors!: Actors

	Description?: React.ComponentType
	contributors?: ContributorRole[]

	supportedPatches?: SupportedPatches

	override initialise() {
		this.Description = this.parser.meta.Description
		this.contributors = this.parser.meta.contributors

		// If the job meta doesn't have supported patches, skip using the full meta so we don't display the core support range.
		const jobMeta = AVAILABLE_MODULES.JOBS[this.parser.actor.job]
		this.supportedPatches = jobMeta?.supportedPatches != null
			? this.parser.meta.supportedPatches
			: undefined
	}

	override output() {
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

		const loggedLevel = this.actors.get(this.parser.actor).level

		return (
			<div className={styles.container}>
				<div className={styles.description}>
					<Header><NormalisedMessage message={About.title}/></Header>

					{this.Description != null && <this.Description/>}

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

					<dt>Logged Level:</dt>
					<dd>{loggedLevel}</dd>

					{this.contributors != null && this.contributors.length > 0 && <>
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
