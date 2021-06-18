import React from 'react'
import {AccordionContent} from './AccordionContent'
import {AccordionPanel} from './AccordionPanel'
import {AccordionTitle} from './AccordionTitle'

export interface Panel {
	key: React.Key,
	title: {
		key?: React.Key,
		className?: string,
		content: React.ReactNode,
	},
	content: {
		key?: React.Key,
		content: React.ReactNode,
	},
}

interface Props {
	exclusive?: boolean,
	panels: Panel[],
	defaultActiveIndex?: React.Key[],
	hasBullet?: boolean,
}

export class Accordion extends React.PureComponent<Props> {
	static Title = AccordionTitle
	static Content = AccordionContent
	static Panel = AccordionPanel

	isPanelOpen(index: React.Key) {
		const {defaultActiveIndex} = this.props
		if (!defaultActiveIndex) {
			return false
		}
		return defaultActiveIndex?.indexOf(index) !== -1 ? true : false
	}

	render() {
		const {panels, hasBullet = true, children} = this.props
		return (
			<>
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
			</>
		)
	}
}
