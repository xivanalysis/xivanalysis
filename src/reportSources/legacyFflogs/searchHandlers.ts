import {SearchHandler} from 'reportSources'
import {buildReportFlowPath} from 'components/ReportFlow'

export const legacyFflogsSearchHandlers: SearchHandler[] = [
	/**
	 * FF Logs
	 * https://www.fflogs.com/reports/1234567890abcdef
	 * 1234567890abcdef
	 * 1234567890abcdef#fight=1
	 * 1234567890abcdef#source=1
	 * 1234567890abcdef#fight=1&source=1
	 */
	{
		regexp: /^(?:.*fflogs\.com\/reports\/)?(?<code>(?:a:)?[a-zA-Z0-9]{16})\/?(?:#(?=(?:.*fight=(?<fight>[^&]*))?)(?=(?:.*source=(?<source>[^&]*))?).*)?$/,
		handler: ({code, fight, source}) => {
			if (fight === 'last') {
				return {
					valid: true,
					path: `/last/${code}/${source ?? ''}`,
				}
			}

			return {
				valid: true,
				path: `/${code}${buildReportFlowPath(fight, source)}`,
			}
		},
	},
]
