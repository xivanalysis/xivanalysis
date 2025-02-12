import {Container} from 'akkd'
import classnames from 'classnames'
import _ from 'lodash'
import {useContext, useEffect, useState} from 'react'
import {Link, Route, useLocation, Routes, Navigate} from 'react-router-dom'
import {reportSources} from 'reportSources'
import {Icon} from 'semantic-ui-react'
import {StoreContext} from 'store'
import styles from './App.module.css'
import {ErrorBoundary} from './ErrorBoundary'
import {GlobalSidebar} from './GlobalSidebar'
import {Home} from './Home'
import {ReportRedirect} from './Home/ReportRedirect'

import 'semantic-ui-css/semantic.min.css'
import './App.css'

export function App() {
	const context = useContext(StoreContext)
	const [sidebarOpen, setSidebarOpen] = useState(false)

	const {pathname} = useLocation()

	// If the user has browsed, clear the global error state.
	useEffect(() => {
		 context.globalErrorStore.clearGlobalError()
	}, [context, pathname])

	const onHome = pathname === '/'

	// Strip trailing slashes for everything beyond home.
	if (!onHome && pathname.endsWith('/')) {
		return (
			<Navigate
				to={_.trimEnd(pathname, '/')}
				replace={true}
			/>
		)
	}

	return <>
		<div className={classnames(
			styles.mobileHeader,
			onHome && styles.home,
		)}>
			<Icon
				name="bars"
				className={styles.hamburger}
				onClick={() => setSidebarOpen(value => !value)}
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
					onClick={() => setSidebarOpen(value => !value)}
				/>
			</div>

			<Container className={styles.content}>
				<ErrorBoundary>
					<Routes>
						<Route index={true} element={<Home/>}/>
						<Route path="/report-redirect/*" element={<ReportRedirect/>}/>

						{/* Report sources*/}
						{reportSources.map(source => (
							<Route key={source.path} path={source.path}>
								<Route index path="*" element={<source.Component/>}/>
							</Route>
						))}
					</Routes>
				</ErrorBoundary>
			</Container>
		</div>
	</>
}
