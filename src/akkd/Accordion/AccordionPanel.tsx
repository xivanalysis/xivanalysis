import classNames from 'classnames'
import React from 'react'
import styles from './Accordion.module.css'
import {AccordionContent} from './AccordionContent'
import {AccordionTitle} from './AccordionTitle'

interface Props {
	panel: any,
	isOpen: boolean,
	hasBullet: boolean,
}

export class AccordionPanel extends React.PureComponent<Props> {
	render() {
		const {panel, isOpen, hasBullet, children} = this.props
		return (
			<details className={classNames(
				styles.accordion,
				!hasBullet && styles.noBullet,
			)} open={isOpen}>
				{panel ?
					<>
						<AccordionTitle index={panel.key} className={panel.title.className}>
							{panel.title.content}
						</AccordionTitle>
						<AccordionContent>
							{panel.content.content}
						</AccordionContent>
					</>
				:
					children
				}
			</details>
		)
	}
}
