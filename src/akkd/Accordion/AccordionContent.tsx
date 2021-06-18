import React from 'react'
import styles from './Accordion.module.css'

export class AccordionContent extends React.PureComponent {
	render() {
		const {children} = this.props
		return (
			<div className={styles.accordionContent}>
				{children}
			</div>
		)
	}
}
