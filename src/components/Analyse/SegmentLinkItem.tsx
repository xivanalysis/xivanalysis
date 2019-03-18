import classnames from 'classnames'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import _ from 'lodash'
import {Result} from 'parser/core/Parser'
import React from 'react'
import styles from './SegmentLinkItem.module.css'
import {Consumer} from './SegmentPositionContext'

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
			<NormalisedMessage message={result.name} id={result.i18n_id}/>
		</div>
	)}</Consumer>
}
