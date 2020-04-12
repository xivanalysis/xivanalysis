import classNames from 'classnames'
import React from 'react'
import {Panel} from './Accordion'
import styles from './Accordion.module.css'
import {AccordionContent} from './AccordionContent'
import {AccordionTitle} from './AccordionTitle'

interface Props {
	panel: Panel,
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
						<AccordionTitle index={panel.title.key || panel.key} className={panel.title.className}>
							{panel.title.content}
						</AccordionTitle>
						<AccordionContent key={panel.content.key}>
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
