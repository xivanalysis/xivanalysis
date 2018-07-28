import React from 'react'
import {Trans} from '@lingui/react'

export default function(props) {
	if ( props.id && typeof props.defaults === 'string' ) {
		return <Trans id={props.id} defaults={props.defaults} />
	}

	return props.defaults || props.children
}
