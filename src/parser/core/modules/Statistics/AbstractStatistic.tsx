import React from 'react'
import {ColumnSpan, Statistic} from './Statistics'

export interface AbstractStatisticOptions {
	info?: React.ReactNode
	width?: ColumnSpan
	height?: number
	statsDisplayOrder?: number
}

export abstract class AbstractStatistic implements Statistic {
	abstract Content: React.ComponentType

	Info?: React.ComponentType
	width?: ColumnSpan
	height?: number
	statsDisplayOrder?: number

	constructor(opts: AbstractStatisticOptions) {
		this.width = opts.width
		this.height = opts.height
		this.statsDisplayOrder = opts.statsDisplayOrder

		if (opts.info) {
			this.Info = () => <>{opts.info}</>
		}
	}
}
