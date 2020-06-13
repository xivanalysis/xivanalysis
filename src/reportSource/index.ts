export * from './base'
export * from './legacyFflogs'

import {SearchHandler} from './base'
import {LegacyFflogs, legacyFflogsSearchHandlers} from './legacyFflogs'

export interface ReportSource {
	path: string,
	Component: React.ComponentType,
	searchHandlers?: SearchHandler[]
}

export const reportSources: ReportSource[] = [
	{
		path: 'fflogs',
		Component: LegacyFflogs,
		searchHandlers: legacyFflogsSearchHandlers,
	},
]
