import classNames from 'classnames'
import React from 'react'
import styles from './Header.module.css'

interface Props {
	className?: string,
}

export class Subheader extends React.PureComponent<Props> {
	render() {
		const {className, children} = this.props
		return (
			<div className={classNames(
				styles.subheader,
				className,
			)}>
				{children}
			</div>
		)
	}
}
