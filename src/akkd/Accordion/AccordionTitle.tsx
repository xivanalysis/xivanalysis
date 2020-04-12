import classNames from 'classnames'
import React from 'react'
import styles from './Accordion.module.css'

interface Props<T> {
	index: T,
	className?: string,
	onClick?: (event: React.MouseEvent, props: {index: T}) => void,
}

export class AccordionTitle extends React.PureComponent<Props<any>> {
	render() {
		const {index, className, onClick = () => {}, children} = this.props
		return (
			<summary
				className={classNames(
					styles.accordionTitle,
					className,
				)}
				onClick={(e)=>onClick(e, {index})}
			>
				{children}
			</summary>
		)
	}
}
