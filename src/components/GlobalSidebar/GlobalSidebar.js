import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'
import {Link, withRouter} from 'react-router-dom'

import Breadcrumbs from './Breadcrumbs'
import Options from './Options'

import styles from './GlobalSidebar.module.css'

// TODO: This assumes there's only ever one GlobalSidebar. Which, I mean... there is. But what if there /isn't/!
let contentRef = React.createRef() // eslint-disable-line prefer-const

@withRouter
class GlobalSidebar extends React.Component {
	static propTypes = {
		location: PropTypes.shape({
			pathname: PropTypes.string.isRequired,
		}).isRequired,
	}

	render() {
		const {location: {pathname}} = this.props
		const onHome = pathname === '/'

		// TODO: classnames
		const sidebarStyles = [
			styles.sidebar,
			onHome && styles.home,
		]
			.filter(Boolean)
			.join(' ')

		return <div className={sidebarStyles}>
			<div className={styles.wrapper}>
				{/* Main logo */}
				<Link to="/" className={styles.logo}>
					<img
						src={process.env.PUBLIC_URL + '/logo.png'}
						alt="logo"
						className={styles.logoImage}
					/>
					xivanalysis
				</Link>

				<Breadcrumbs/>

				{/* Content */}
				<div ref={contentRef} className={styles.content}/>

				{/* Options pinned to the bottom */}
				<div className={styles.options}>
					<Options/>
				</div>
			</div>
		</div>
	}
}

export class SidebarContent extends React.Component {
	static propTypes = {
		children: PropTypes.node,
	}
	render() {
		return ReactDOM.createPortal(
			this.props.children,
			contentRef.current,
		)
	}
}

export default GlobalSidebar
