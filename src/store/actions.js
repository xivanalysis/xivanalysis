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

export const fetchReport = (code, params) => async dispatch => {
	dispatch(setReport({loading: true}))

	let response = null
	try {
		response = await fflogsApi.get(`/report/fights/${code}`, {
			params: {
				translate: true,
				...params,
			},
		})
	} catch (e) {
		// Something's gone wrong, clear report status then dispatch an error
		dispatch(setReport(null))

		// TODO: Probably need more handling than this...
		if (e.response && e.response.data.error === 'This report does not exist or is private.') {
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

export const refreshReport = () => (dispatch, getState) => {
	const report = getState().report
	if (!report || report.loading) { return }
	dispatch(fetchReport(report.code, {bypassCache: true}))
}

export const SET_LANGUAGE = 'SET_LANGUAGE'
export const setLanguage = language => ({
	type: SET_LANGUAGE,
	payload: language,
})

export const UPDATE_LANGUAGE = 'UPDATE_LANGUAGE'
export const updateLanguage = () => ({
	type: UPDATE_LANGUAGE,
})

export const TOGGLE_I18N_OVERLAY = 'TOGGLE_I18N_OVERLAY'
export const toggleI18nOverlay = () => ({
	type: TOGGLE_I18N_OVERLAY,
})

export const SET_I18N_OVERLAY = 'SET_I18N_OVERLAY'
export const setI18nOverlay = state => ({
	type: SET_I18N_OVERLAY,
	payload: state,
})

export const UPDATE_SETTINGS = 'UPDATE_SETTINGS'
export const updateSettings = settings => ({
	type: UPDATE_SETTINGS,
	payload: settings,
})
