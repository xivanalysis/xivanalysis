import {Trans} from '@lingui/react'
import classnames from 'classnames'
import _ from 'lodash'
import {Result} from 'parser/core/Parser'
import React from 'react'
import {
	Menu,
} from 'semantic-ui-react'
import styles from './SegmentLinkItem.module.css'
import {Consumer, Context} from './SegmentPositionContext'

interface Props {
	index: number
	result: Result
}

export default function SegmentLinkItem({result, index}: Props) {
	return <Consumer>{({active, scrollToId}) => (
		<div
			className={classnames(
				styles.link,
				active === index && styles.active,
			)}
			onClick={() => scrollToId(index)}
		>
			<Trans id={result.i18n_id} defaults={result.name}/>
		</div>
	)}</Consumer>
}
