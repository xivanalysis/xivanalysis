import classNames from 'classnames'
import {PureComponent, ReactNode} from 'react'
import styles from './Container.module.css'

interface Props {
	className?: string,
	children?: ReactNode
}

export class Container extends PureComponent<Props> {
	override render() {
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
