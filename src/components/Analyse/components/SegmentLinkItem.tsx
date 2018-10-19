import React from 'react'

import _ from 'lodash'
import Scroll from 'react-scroll'
import {Trans} from '@lingui/react'
import {
	Menu,
} from 'semantic-ui-react'

import { ParserResult } from 'parser/core/Parser'

interface Props {
	result: ParserResult
	active: boolean
	onSetActive (): void
}

export default function SegmentLinkItem ({ result, active, onSetActive }: Props) {
	return <Menu.Item
		active={active}
		as={Scroll.Link}
		// Scroll.Link props
		to={result.name}
		offset={-50}
		smooth
		spy
		onSetActive={onSetActive}
	>
		<Trans id={result.i18n_id} defaults={result.name /* Doing manually so SUI doesn't modify my text */} />
	</Menu.Item>
}
