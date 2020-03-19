import React from 'react'
import styles from './Accordion.module.css'
import {AccordionContent} from './AccordionContent'
import {AccordionPanel} from './AccordionPanel'
import {AccordionTitle} from './AccordionTitle'

interface Panel {
	key: any,
	title: {
		key?: any,
		className?: string,
		content: any,
	},
	content: {
		key?: any,
		content: any,
	},
}

interface Props {
	exclusive?: boolean,
	panels: Panel[],
	defaultActiveIndex?: number|number[],
	hasBullet?: boolean,
}

export class Accordion extends React.PureComponent<Props> {
	static Title = AccordionTitle
	static Content = AccordionContent
	static Panel = AccordionPanel

	isPanelOpen(index: number) {
		const {defaultActiveIndex} = this.props
		if (!defaultActiveIndex) {
			return false
		}
		if (typeof defaultActiveIndex === 'number') {
			return index === defaultActiveIndex ? true : false
		} else {
			return defaultActiveIndex?.indexOf(index) !== -1 ? true : false
		}
	}

	render() {
		const {panels, hasBullet = true, children} = this.props
		return (
			<div>
				{panels ? panels.map(panel =>
					<AccordionPanel
						key={panel.key}
						panel={panel}
						isOpen={this.isPanelOpen(panel.key)}
						hasBullet={hasBullet}
					/>)
				:
					children
				}
			</div>
		)
	}
}
