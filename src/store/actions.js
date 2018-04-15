import { fflogsApi } from '@/api'

export const SET_REPORT = 'SET_REPORT'
export function setReport(report) {
	return {
		type: SET_REPORT,
		payload: report
	}
}

export function fetchReport(code) {
	return async dispatch => {
		dispatch(setReport(null))

		const response = await fflogsApi.get('/report/fights/' + code)
		// TODO: error checking

		// Toss the code into the report object
		const report = {
			...response.data,
			code
		}

		dispatch(setReport(report))
	}
}

export function fetchReportIfNeeded(code) {
	return (dispatch, getState) => {
		const state = getState()
		if (!state.report) {
			return dispatch(fetchReport(code))
		}
	}
}
