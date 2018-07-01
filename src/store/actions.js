import {fflogsApi} from 'api'
import * as Errors from 'errors'

export const SET_GLOBAL_ERROR = 'SET_GLOBAL_ERROR'
export const setGlobalError = (error) => ({
	type: SET_GLOBAL_ERROR,
	error,
})

export const CLEAR_GLOBAL_ERROR = 'CLEAR_GLOBAL_ERROR'
export const clearGlobalError = () => ({type: CLEAR_GLOBAL_ERROR})

export const SET_REPORT = 'SET_REPORT'
export const setReport = (report) => ({
	type: SET_REPORT,
	payload: report,
})

export const fetchReport = (code) => async dispatch => {
	dispatch(setReport({loading: true}))

	let response = null
	try {
		response = await fflogsApi.get(`/report/fights/${code}`, {
			params: {
				translate: true,
			},
		})
	} catch (e) {
		// Something's gone wrong, clear report status then dispatch an error
		dispatch(setReport(null))

		// TODO: Probably need more handling than this...
		if (e.response.data.error === 'This report does not exist or is private.') {
			dispatch(setGlobalError(new Errors.ReportNotFoundError()))
		} else {
			dispatch(setGlobalError(new Errors.UnknownApiError()))
		}
		return
	}

	// Toss the code into the report object
	const report = {
		...response.data,
		code,
		loading: false,
	}

	dispatch(setReport(report))
}

export const fetchReportIfNeeded = code => (dispatch, getState) => {
	const report = getState().report
	if (!report || (report.code !== code && !report.loading)) {
		return dispatch(fetchReport(code))
	}
}
