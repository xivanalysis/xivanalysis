import React from 'react'

import {Trans} from '@lingui/react'
import _ from 'lodash'
import {
	Menu,
} from 'semantic-ui-react'

import {Consumer, Context} from './SegmentPositionContext'

import {Result} from 'parser/core/Parser'

interface Props {
	index: number
	result: Result
}

export default function SegmentLinkItem({result, index}: Props) {
	return <Consumer>{({active, scrollToId}) => (
		<Menu.Item
			active={active === index}
			onClick={() => { scrollToId(index) }}
		>
			<Trans id={result.i18n_id} defaults={result.name /* Doing manually so SUI doesn't modify my text */} />
		</Menu.Item>
	)}</Consumer>
}
