import classNames from 'classnames'
import React from 'react'
import styles from './Header.module.css'

interface Props {
	className?: string,
}

export class Content extends React.PureComponent<Props> {
	render() {
		const {className, children} = this.props
		return (
			<div className={classNames(
				styles.content,
				className,
			)}>
				{children}
			</div>
		)
	}
}
