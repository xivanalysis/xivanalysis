import {getCorrectedFight, getZoneBanner} from 'data/BOSSES'
import {GameEdition, getPatch, languageToEdition} from 'data/PATCHES'
import {observer} from 'mobx-react'
import PropTypes from 'prop-types'
import React from 'react'
import {Helmet} from 'react-helmet'
import {Link, withRouter} from 'react-router-dom'
import {Icon} from 'semantic-ui-react'
import {StoreContext} from 'store'
import {formatDuration, getPathMatch} from 'utilities'
import styles from './Breadcrumbs.module.css'

const editionName = {
	[GameEdition.GLOBAL]: <Icon name="globe"/>,
	[GameEdition.KOREAN]: 'KR',
	[GameEdition.CHINESE]: 'CN',
}

@observer
class Breadcrumbs extends React.Component {
	static propTypes = {
		location: PropTypes.shape({
			pathname: PropTypes.string.isRequired,
		}).isRequired,
	}

	static contextType = StoreContext

	render() {
		const {reportStore} = this.context
		const {
			location: {pathname},
		} = this.props

		const report = reportStore.report

		// Need to do this janky shit to get the router path match
		const pathMatch = getPathMatch(pathname)

		// Grab the field we're interested in
		const pathParams = pathMatch ? pathMatch.params : {}
		const code = pathParams.code
		const fightId = parseInt(pathParams.fight, 10)
		const combatantId = parseInt(pathParams.combatant, 10)

		const reportLoaded = report && !report.loading && report.code === code
		const crumbs = []

		let crumbsBackground

		// Report
		if (code) {
			let title = code
			let subtitle = null

			if (reportLoaded) {
				title = report.title

				const edition = languageToEdition(report.lang)
				const patch = getPatch(edition, report.start / 1000)
				subtitle = <>({editionName[edition]} {patch})</>
			}

			crumbs.push({
				title,
				subtitle,
				url: `/find/${code}/`,
			})
		}

		// Fight
		if (fightId) {
			let title = fightId
			let subtitle = null
			if (reportLoaded && report.fights && fightId !== 'last') {
				const rawFight = report.fights.find(fight => fight.id === fightId)
				if (rawFight) {
					const fight = getCorrectedFight(rawFight)
					const start_time = parseInt(fight.start_time, 10)
					const end_time = parseInt(fight.end_time, 10)
					subtitle = `(${formatDuration(Math.floor(end_time - start_time) / 1000)})`

					crumbsBackground = getZoneBanner(fight.zoneID)
					title = fight.name
				}
			}
			crumbs.push({
				title,
				subtitle,
				url: `/find/${code}/${fightId}/`,
			})
		}

		// Combatant
		if (combatantId) {
			let title = combatantId
			if (reportLoaded && report.friendlies) {
				const combatant = report.friendlies.find(friendly => friendly.id === combatantId)
				title = combatant ? combatant.name : combatantId
			}
			crumbs.push({
				title,
				url: `/analyse/${code}/${fightId}/${combatantId}/`,
			})
		}

		return <>
			<Helmet>
				<title>
					{crumbs.length ? crumbs[crumbs.length - 1].title + ' | ' : ''}
					xivanalysis
				</title>
			</Helmet>

			{crumbs.length > 0 && (
				<div className={styles.crumbs}>
					{crumbsBackground && (
						<div
							className={styles.crumbsBackground}
							style={{backgroundImage: `url(${crumbsBackground})`}}
						/>
					)}
					{crumbs.map(crumb => (
						<Link
							key={crumb.url}
							to={crumb.url}
							className={styles.link}
						>
							{crumb.title}
							{crumb.subtitle && <>
								&nbsp;<span className={styles.linkSubtitle}>{crumb.subtitle}</span>
							</>}
						</Link>
					))}
				</div>
			)}
		</>
	}
}

export default withRouter(Breadcrumbs)
