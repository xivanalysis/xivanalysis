import Module from 'parser/core/Module'
import React from 'react'
import {Component} from './Component'

export class Timeline extends Module {
	static handle = 'timelineNeue'
	static displayOrder = -1000

	output() {
		return <TempWrapper/>
	}
}

const TempWrapper = () => {
	const [mult, setMult] = React.useState(1)
	const tickMult = React.useCallback(() => setMult(mult => mult + 1), [])
	return (
		<div onClick={tickMult}>
			<Component max={1000 * mult}/>
		</div>
	)
}
