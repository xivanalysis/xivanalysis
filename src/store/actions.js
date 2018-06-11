import { fflogsApi } from 'api'
import * as Errors from 'errors'

export const SET_GLOBAL_ERROR = 'SET_GLOBAL_ERROR'
export const setGlobalError = (error) => ({
	type: SET_GLOBAL_ERROR,
	error
})

export const CLEAR_GLOBAL_ERROR = 'CLEAR_GLOBAL_ERROR'
export const clearGlobalError = () => ({type: CLEAR_GLOBAL_ERROR})

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

		let response = null
		try {
			response = await fflogsApi.get('/report/fights/' + code)
		} catch (e) {
			// Something's gone wrong, dispatch the error over state
			console.log(e.response)
			// TODO: This isn't actually correct handling
			dispatch(setReport(null))
			dispatch(setGlobalError(new Errors.LogNotFoundError()))
			return
		}

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
