import {combineReducers} from 'redux'

import * as ActionTypes from './actions'

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

const rootReducer = combineReducers({
	report,
	globalError,
})

export default rootReducer
