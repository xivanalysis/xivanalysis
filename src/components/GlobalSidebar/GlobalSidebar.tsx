import classnames from 'classnames'
import {createRef, ReactNode} from 'react'
import ReactDOM from 'react-dom'
import {Link} from 'react-router-dom'
import {Breadcrumbs} from './Breadcrumbs'
import styles from './GlobalSidebar.module.css'
import {Options} from './Options'

// TODO: This assumes there's only ever one GlobalSidebar. Which, I mean... there is. But what if there /isn't/!
const contentRef = createRef<HTMLDivElement>()

export type GlobalSidebarProps = {
	centerLogo: boolean
}

export function GlobalSidebar({centerLogo}: GlobalSidebarProps) {
	return (
		<div className={styles.sidebar}>
			{/* Main logo */}
			<Link to="/" className={classnames(
				styles.logo,
				centerLogo && styles.center,
			)}>
				<img
					src={process.env.PUBLIC_URL + '/logo.png'}
					alt="logo"
					className={styles.logoImage}
				/>
				xivanalysis
			</Link>

			<Breadcrumbs />

			{/* Content */}
			<div ref={contentRef} className={styles.content} />

			{/* Options pinned to the bottom */}
			<div className={styles.options}>
				<Options />
			</div>
		</div>
	)
}

export type SidebarContentProps = {
	children?: ReactNode
}

export function SidebarContent({children}: SidebarContentProps) {
	return ReactDOM.createPortal(
		children,
		// @ts-expect-error TODO: This is unsound, but has been safe until now. Fix properly.
		contentRef.current,
	)
}
