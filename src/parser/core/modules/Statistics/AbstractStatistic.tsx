import React from 'react'
import {ColumnSpan, Statistic} from './Statistics'

export interface AbstractStatisticOptions {
	info?: React.ReactNode
	width?: ColumnSpan
	height?: number
	order?: number
}

export abstract class AbstractStatistic implements Statistic {
	abstract Content: React.ComponentType

	Info?: React.ComponentType
	width?: ColumnSpan
	height?: number
	order?: number

	constructor(opts: AbstractStatisticOptions) {
		this.width = opts.width
		this.height = opts.height
		this.order = opts.order

		if (opts.info) {
			this.Info = () => <>{opts.info}</>
		}
	}
}
