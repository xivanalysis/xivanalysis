import classNames from 'classnames'
import React from 'react'
import {Content} from './Content'
import styles from './Header.module.css'
import {Subheader} from './Subheader'

interface Props {
	className?: string,
}

export class Header extends React.PureComponent<Props> {
	static Content = Content
	static Subheader = Subheader
	render() {
		const {className, children} = this.props
		return (
			<div className={classNames(
				styles.header,
				className,
			)}>
				{children}
			</div>
		)
	}
}
