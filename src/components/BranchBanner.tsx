import {Trans} from '@lingui/react'
import {Segment} from 'akkd'
import PATCHES, {getPatch, languageToEdition} from 'data/PATCHES'
import {observer} from 'mobx-react'
import React from 'react'
import {RouteComponentProps, withRouter} from 'react-router'
import {Header} from 'semantic-ui-react'
import {StoreContext} from 'store'
import styles from './BranchBanner.module.css'

@observer
class BranchBannerComponent extends React.Component<RouteComponentProps> {
	static contextType = StoreContext
	context!: React.ContextType<typeof StoreContext>

	render() {
		const {reportStore} = this.context
		const {location} = this.props
		const {report} = reportStore!

		// If there's no report, or it's still loading, there's not much we can display
		if (!report || report.loading) {
			return null
		}

		// Get the patch data for the report
		const edition = languageToEdition(report.lang)
		const patchKey = getPatch(edition, report.start / 1000)
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
