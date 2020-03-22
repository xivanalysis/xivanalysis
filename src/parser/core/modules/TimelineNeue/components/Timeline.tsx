import React, {memo, ReactNode} from 'react'
import {Axis} from './Axis'
import {LabelSpacer, Row} from './Row'
import {ScaleHandler, ScaleHandlerProps} from './ScaleHandler'

export type TimelineProps =
	& ScaleHandlerProps
	& {children?: ReactNode}

export const Timeline = memo<TimelineProps>(function Timeline({
	children,
	...props
}) { return (
	<LabelSpacer>
		<ScaleHandler {...props}>
			<Row>
				<Row>
					{children}
				</Row>
				<Axis/>
			</Row>
		</ScaleHandler>
	</LabelSpacer>
) })
