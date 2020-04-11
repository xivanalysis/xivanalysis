import classNames from 'classnames'
import React from 'react'
import styles from './Header.module.css'

interface Props {
	className?: string,
	children: React.ReactNode,
}

export const Content = React.memo(
	function Content(props: Props) {
		const {className, children} = props
		return (
			<div className={classNames(
				styles.content,
				className,
			)}>
				{children}
			</div>
		)
	},
)
