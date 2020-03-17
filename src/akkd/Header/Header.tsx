import classNames from 'classnames'
import React from 'react'
import {Content} from './Content'
import styles from './Header.module.css'
import {Subheader} from './Subheader'

interface Sizes {
	small?: boolean
	medium?: boolean
	large?: boolean
}

const sizePrecedence: ReadonlyArray<keyof Sizes> = [
	'large',
	'medium',
	'small',
]

interface Props extends Sizes {
	className?: string,
}

export class Header extends React.PureComponent<Props> {
	static Content = Content
	static Subheader = Subheader
	render() {
		const {className, children} = this.props
		const size = sizePrecedence.find(prop => this.props[prop] === true)

		return (
			<div className={classNames(
				styles.header,
				size ? styles[size] : styles.large,
				className,
			)}>
				{children}
			</div>
		)
	}
}
