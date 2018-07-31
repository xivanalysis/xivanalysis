import {combineReducers} from 'redux'

import * as ActionTypes from './actions'

import {DEFAULT_LANGUAGE} from 'data/LANGUAGES'

const report = (state=null, action) => {
	if (action.type === ActionTypes.SET_REPORT) {
		return action.payload
	}
	return state
}

const globalError = (state=null, action) => {
	switch (action.type) {
	case ActionTypes.SET_GLOBAL_ERROR:
		return action.error
	case ActionTypes.CLEAR_GLOBAL_ERROR:
		return null
	default:
		return state
	}
}

const language = (state=DEFAULT_LANGUAGE, action) => {
	switch (action.type) {
	case ActionTypes.SET_LANGUAGE:
		return action.payload
	default:
		return state
	}
}

const i18nOverlay = (state=false, action) => {
	switch (action.type) {
	case ActionTypes.TOGGLE_I18N_OVERLAY:
		return ! state
	case ActionTypes.SET_I18N_OVERLAY:
		return action.payload
	default:
		return state
	}
}

const rootReducer = combineReducers({
	report,
	globalError,
	language,
	i18nOverlay,
})

export default rootReducer
