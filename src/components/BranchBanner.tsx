import {Trans} from '@lingui/react'
import {Segment} from 'akkd'
import PATCHES, {getPatch} from 'data/PATCHES'
import {observer} from 'mobx-react'
import React from 'react'
import {RouteComponentProps, withRouter} from 'react-router'
import {Report} from 'report'
import {Header} from 'semantic-ui-react'
import styles from './BranchBanner.module.css'

type BranchBannerProps =
	& RouteComponentProps
	& {report: Report}

@observer
class BranchBannerComponent extends React.Component<BranchBannerProps> {
	override render() {
		const {location, report} = this.props

		// Get the patch data for the report
		const patchKey = getPatch(report.edition, report.timestamp / 1000)
		const patch = PATCHES[patchKey]

		// If there's no branch data, we don't need to do anything
		if (!patch.branch) {
			return null
		}

		// There's a branch - tell the user to go somewhere else
		const redirectUrl = patch.branch.baseUrl + location.pathname

		return (
			<Segment>
				<a
					href={redirectUrl}
					className={styles.container}
				>
					<div className={styles.text}>
						<Trans id="core.branch-banner.header" render={<Header/>}>
							This report is from a different expansion!
						</Trans>
						<Trans id="core.branch-banner.description">
							This version of xivanalysis cannot provide meaningful analysis for reports that were logged during {patchKey}. Please click here to analyse this log using the {patchKey} version of the site.
						</Trans>
					</div>
					<div className={styles.background}/>
				</a>
			</Segment>
		)
	}
}

export const BranchBanner = withRouter(BranchBannerComponent)
