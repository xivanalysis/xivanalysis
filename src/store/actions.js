import { fflogsApi } from 'api'

export const SET_REPORT = 'SET_REPORT'
export function setReport(report) {
	return {
		type: SET_REPORT,
		payload: report
	}
}

export function fetchReport(code) {
	return async dispatch => {
		dispatch(setReport({loading: true}))

		const response = await fflogsApi.get('/report/fights/' + code)
		// TODO: error checking

		// Toss the code into the report object
		const report = {
			...response.data,
			code,
			loading: false
		}

		dispatch(setReport(report))
	}
}

export function fetchReportIfNeeded(code) {
	return (dispatch, getState) => {
		const report = getState().report
		if (!report || (report.code !== code && !report.loading)) {
			return dispatch(fetchReport(code))
		}
	}
}
