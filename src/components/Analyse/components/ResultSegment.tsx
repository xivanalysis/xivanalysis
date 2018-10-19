import React from 'react'

import Scroll from 'react-scroll'
import {Trans} from '@lingui/react'
import {
	Header,
	Segment,
} from 'semantic-ui-react'

import { ParserResult } from 'parser/core/Parser'

interface Props {
	result: ParserResult
}

export default function ResultSegment ({ result }: Props) {
	return <Segment vertical as={Scroll.Element} name={result.name}>
		<Header><Trans id={result.i18n_id} defaults={result.name} /></Header>
		{result.markup}
	</Segment>
}
