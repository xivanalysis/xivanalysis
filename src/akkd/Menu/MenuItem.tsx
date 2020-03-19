import classNames from 'classnames'
import React from 'react'
import styles from './Menu.module.css'

interface Props {
	as?: React.ReactType,
	className?: string,
}

export class MenuItem extends React.PureComponent<Props> {
	render() {
		const {as: Component = 'div', className, children, ...props} = this.props

		return <Component className={classNames(
				styles.item,
				className,
			)} {...props}>
			{children}
		</Component>
	}
}
