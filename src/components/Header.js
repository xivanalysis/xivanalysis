import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {Helmet} from 'react-helmet'
import {connect} from 'react-redux'
import {Link, withRouter} from 'react-router-dom'
import withSizes from 'react-sizes'
import {Container, Dropdown, Menu} from 'semantic-ui-react'

import {compose, getPathMatch} from 'utilities'

import styles from './Header.module.css'

class Header extends Component {
	static propTypes = {
		location: PropTypes.shape({
			pathname: PropTypes.string.isRequired,
		}).isRequired,
		report: PropTypes.shape({
			loading: PropTypes.bool.isRequired,
			title: PropTypes.string,
			code: PropTypes.string,
		}),
		collapseMenu: PropTypes.bool.isRequired,
	}

	formatDuration(duration) {
		const seconds = Math.floor(duration % 60)
		return `${Math.floor(duration / 60)}:${seconds < 10? '0' : ''}${seconds}`
	}

	render() {
		const {
			location: {pathname},
			report,
		} = this.props

		// Need to do this janky shit to get the router path match
		const pathMatch = getPathMatch(pathname)

		// Grab the field we're interested in
		const pathParams = pathMatch? pathMatch.params : {}
		const code = pathParams.code
		const fightId = parseInt(pathParams.fight, 10)
		const combatantId = parseInt(pathParams.combatant, 10)

		const reportLoaded = report && !report.loading && report.code === code
		const crumbs = []

		// Report
		if (code) {
			let title = code
			if (reportLoaded) {
				title = report.title
			}
			crumbs.push({
				title,
				url: `/find/${code}/`,
			})
		}

		// Fight
		if (fightId) {
			let title = fightId
			if (reportLoaded && report.fights && fightId !== 'last') {
				const fight = report.fights.find(fight => fight.id === fightId)
				let time = ''
				if(fight){
					const start_time = parseInt(fight.start_time, 10)
					const end_time = parseInt(fight.end_time, 10)
					const duration = this.formatDuration(Math.floor(end_time - start_time)/1000)
					time = duration
				}
				title = `${fight? fight.name : fightId} (${time})`
			}
			crumbs.push({
				title,
				url: `/find/${code}/${fightId}/`,
			})
		}

		// Combatant
		if (combatantId) {
			let title = combatantId
			if (reportLoaded && report.friendlies) {
				const combatant = report.friendlies.find(friendly => friendly.id === combatantId)
				title = combatant? combatant.name : combatantId
			}
			crumbs.push({
				title,
				url: `/analyse/${code}/${fightId}/${combatantId}/`,
			})
		}

		const onHome = pathname === '/'
		const collapseMenu = this.props.collapseMenu && !onHome

		return <Menu
			fixed="top"
			inverted
			secondary={onHome}
			size={onHome? 'massive' : null}
		>
			<Helmet>
				<title>
					{crumbs.length? crumbs[crumbs.length - 1].title + ' | ' : ''}
					xivanalysis
				</title>
			</Helmet>

			<Container>
				{collapseMenu || <Fragment>
					<Menu.Item as={Link} to="/" header>
						<img src={process.env.PUBLIC_URL + '/logo.png'} className={styles.logo} alt="logo"/>
						xivanalysis
					</Menu.Item>

					{crumbs.map(crumb => <Menu.Item
						key={crumb.url}
						as={Link}
						to={crumb.url}
					>
						{crumb.title}
					</Menu.Item>)}
				</Fragment>}

				{collapseMenu && <Dropdown
					text={<Fragment>
						<img
							src={process.env.PUBLIC_URL + '/logo.png'}
							className={styles.logo}
							style={{verticalAlign: 'middle'}}
							alt="logo"
						/>
						<strong>xivanalysis</strong>
					</Fragment>}
					className="link item"
				>
					<Dropdown.Menu>
						<Dropdown.Item as={Link} to="/">
							Home
						</Dropdown.Item>
						{crumbs.map(crumb => <Dropdown.Item
							key={crumb.url}
							as={Link}
							to={crumb.url}
						>
							{crumb.title}
						</Dropdown.Item>)}
					</Dropdown.Menu>
				</Dropdown>}

				<Menu.Menu position="right">
					<Menu.Item className={styles.version}>{process.env.VERSION}</Menu.Item>
					<Menu.Item icon="discord" href="https://discord.gg/jVbVe44" target="_blank"/>
					<Menu.Item icon="github" href="https://github.com/xivanalysis/xivanalysis" target="_blank"/>
				</Menu.Menu>
			</Container>
		</Menu>
	}
}

const mapSizesToProps = ({width}) => ({
	collapseMenu: width < 992,
})

const mapStateToProps = state => ({
	report: state.report,
})

export default compose(
	withRouter,
	withSizes(mapSizesToProps),
	connect(mapStateToProps),
)(Header)
