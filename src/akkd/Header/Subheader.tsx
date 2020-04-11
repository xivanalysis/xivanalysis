import classNames from 'classnames'
import React from 'react'
import styles from './Header.module.css'

interface Props {
	className?: string,
	children: React.ReactNode,
}

export const Subheader = React.memo(
	function Subheader(props: Props) {
		const {className, children} = props
		return (
			<div className={classNames(
				styles.subheader,
				className,
			)}>
				{children}
			</div>
		)
	},
)
