import classNames from 'classnames'
import React from 'react'
import styles from './Accordion.module.css'

interface Props {
	index: any,
	className?: string,
	onClick?: (event: any, props: any) => void,
}

export class AccordionTitle extends React.PureComponent<Props> {
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
