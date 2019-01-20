import classNames from 'classnames'
import React from 'react'
import styles from './Container.module.css'

interface Props {
	className?: string,
}

export class Container extends React.PureComponent<Props> {
	render() {
		const {className, children} = this.props
		return (
			<div className={classNames(
				styles.container,
				className,
			)}>
				{children}
			</div>
		)
	}
}
