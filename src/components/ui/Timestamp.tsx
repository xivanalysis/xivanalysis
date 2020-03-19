import {Button} from 'akkd'
import React from 'react'
import {formatDuration} from 'utilities'

interface Props {
	onClick: ()=>void,
	time: number,
}

export default class Timestamp extends React.PureComponent<Props> {
	render() {
		const {onClick, time} = this.props

		return <Button pill nowrap icon="time" onClick={onClick} content={formatDuration(time/1000)} />
	}
}
