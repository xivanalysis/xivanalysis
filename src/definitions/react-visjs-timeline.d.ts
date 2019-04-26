declare module 'react-visjs-timeline' {
	import React from 'react'
	import Vis from 'vis'

	interface Props {
		items?: Vis.DataItemCollectionType
		groups?: Vis.DataGroupCollectionType
		options?: Vis.TimelineOptions
		selection?: Vis.IdType[]
		// customTimes?: any - the code doesn't seem to agree with the proptypes on this one
		animate?: Vis.TimelineAnimationType
		currentTime?: Vis.DateType

		// Event handlers
		// @types/vis doesn't have typings for the event shapes so I'll follow suit
		currentTimeTickHandler?: (props?: any) => void
		clickHandler?: (props?: any) => void
		contextmenuHandler?: (props?: any) => void
		doubleClickHandler?: (props?: any) => void
		groupDraggedHandler?: (props?: any) => void
		changedHandler?: (props?: any) => void
		rangechangeHandler?: (props?: any) => void
		rangechangedHandler?: (props?: any) => void
		selectHandler?: (props?: any) => void
		timechangeHandler?: (props?: any) => void
		timechangedHandler?: (props?: any) => void
		mouseOverHandler?: (props?: any) => void
		mouseMoveHandler?: (props?: any) => void
		itemoverHandler?: (props?: any) => void
		itemoutHandler?: (props?: any) => void
	}

	class VisTimeline extends React.Component<Props> {}

	export = VisTimeline
}
