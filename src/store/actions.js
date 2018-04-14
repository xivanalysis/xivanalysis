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
		dispatch(setReport(response.data))
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
