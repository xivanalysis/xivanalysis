import classNames from 'classnames'
import React from 'react'
import styles from './Accordion.module.css'

interface Props<T> {
	index: T,
	className?: string,
	onClick?: (event: React.MouseEvent, props: {index: T}) => void,
}

export class AccordionTitle extends React.PureComponent<Props<any>> {
	_onClick = (e: React.MouseEvent) => {
		if (this.props.onClick) {
			this.props.onClick(e, {index: this.props.index})
		}
	}
	render() {
		const {className, children} = this.props
		return (
			<summary
				className={classNames(
					styles.accordionTitle,
					className,
				)}
				onClick={this._onClick}
			>
				{children}
			</summary>
		)
	}
}
