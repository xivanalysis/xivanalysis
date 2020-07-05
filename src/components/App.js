import classnames from 'classnames'
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Link, Route, Switch, withRouter, useRouteMatch, Redirect, useParams} from 'react-router-dom'
import {Icon} from 'semantic-ui-react'

import {Container} from 'akkd'
import {reportSources} from 'reportSources'
import {StoreContext} from 'store'
import {BranchBanner} from './BranchBanner'
import ErrorBoundary from './ErrorBoundary'
import GlobalSidebar from './GlobalSidebar'
import Home from './Home'

import 'semantic-ui-css/semantic.min.css'
import '@xivanalysis/tooltips/dist/index.es.css'
import './App.css'
import styles from './App.module.css'
import {buildReportFlowPath} from './ReportFlow'

class App extends Component {
	static propTypes = {
		history: PropTypes.shape({
			location: PropTypes.object.isRequired,
			listen: PropTypes.func.isRequired,
		}).isRequired,
	}

	static contextType = StoreContext

	_unlisten = null

	state = {
		sidebarOpen: false,
	}

	componentDidMount() {
		// Set up a history listener
		const {history} = this.props
		this._locationDidChange(history.location)
		this._unlisten = history.listen(this._locationDidChange)
	}

	componentWillUnmount() {
		// Destroy the listener as we shut down
		this._unlisten()
	}

	_locationDidChange = (/* location */) => {
		// User's browsed - clear the global error state. Page can always re-throw one.
		const {globalErrorStore} = this.context
		globalErrorStore.clearGlobalError()
	}

	_toggleSidebar = () => {
		this.setState(state => ({sidebarOpen: !state.sidebarOpen}))
	}

	render() {
		const {history: {location: {pathname}}} = this.props
		const {sidebarOpen} = this.state

		const onHome = pathname === '/'

		return <>
			{/* If there's a trailing slash, strip it */}
			<Route path="/*/" exact strict>
				<StripTrailingSlash/>
			</Route>

			<div className={classnames(
				styles.mobileHeader,
				onHome && styles.home,
			)}>
				<Icon
					name="bars"
					className={styles.hamburger}
					onClick={this._toggleSidebar}
				/>
				<Link to="/" className={styles.logo}>
					<img
						src={process.env.PUBLIC_URL + '/logo.png'}
						alt="logo"
						className={styles.logoImage}
					/>
					xivanalysis
				</Link>
			</div>

			<div className={classnames(
				styles.container,
				onHome && styles.home,
			)}>
				<div className={classnames(
					styles.sidebar,
					sidebarOpen && styles.open,
				)}>
					<div className={styles.sidebarWrapper}>
						<GlobalSidebar centerLogo={onHome}/>
					</div>

					<div
						className={styles.sidebarBackdrop}
						onClick={this._toggleSidebar}
					/>
				</div>

				<Container className={styles.content}>
					<BranchBanner/>

					<ErrorBoundary>
						<Switch>
							<Route exact path="/"><Home/></Route>

							<Route path="/(find|analyse)/:code/:fight?/:combatant?">
								<LegacyXivaRouteRedirect/>
							</Route>

							{/* Report sources*/}
							{reportSources.map(source => (
								<Route key={source.path} path={source.path}>
									<source.Component/>
								</Route>
							))}
						</Switch>
					</ErrorBoundary>
				</Container>
			</div>
		</>
	}
}

export default withRouter(App)

function StripTrailingSlash() {
	const {url} = useRouteMatch()
	return <Redirect to={_.trimEnd(url, '/')}/>
}

// TODO: This can probably removed in, like, a few weeks. Hold me to that people.
//       Relies on fflogs = fflogs. Unstable in the long run.
function LegacyXivaRouteRedirect() {
	const {code, fight, combatant} = useParams()
	return <Redirect to={`/fflogs/${code}${buildReportFlowPath(fight, combatant)}`}/>
}
