import classnames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'
import {Link} from 'react-router-dom'

import Breadcrumbs from './Breadcrumbs'
import Options from './Options'

import styles from './GlobalSidebar.module.css'

// TODO: This assumes there's only ever one GlobalSidebar. Which, I mean... there is. But what if there /isn't/!
let contentRef = React.createRef() // eslint-disable-line prefer-const

class GlobalSidebar extends React.Component {
	static propTypes = {
		centerLogo: PropTypes.bool,
	}

	render() {
		const {centerLogo} = this.props

		return <div className={styles.sidebar}>
			{/* Main logo */}
			<Link to="/" className={classnames(
				styles.logo,
				centerLogo && styles.center
			)}>
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
