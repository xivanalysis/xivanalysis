import {combineReducers} from 'redux'

import * as ActionTypes from './actions'

import {getUserLanguage} from 'utilities'

const language = (state=null, action) => {
	if (!state || typeof state !== 'object') {
		state = {
			site_set: false,
			site: getUserLanguage(),
		}
	}

	switch (action.type) {
	case ActionTypes.SET_LANGUAGE:
		return {
			...state,
			site_set: true,
			site: action.payload,
		}

	case ActionTypes.UPDATE_LANGUAGE:
	default:
		if (!state.site_set || !state.site) {
			const site = getUserLanguage()
			if (site !== state.site) {
				return {
					...state,
					site: getUserLanguage(),
				}
			}
		}

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

const settings = (state={}, action) => {
	if (action.type !== ActionTypes.UPDATE_SETTINGS) {
		return state
	}

	return {
		...state,
		...action.payload,
	}
}

const rootReducer = combineReducers({
	language,
	i18nOverlay,
	settings,
})

export default rootReducer
