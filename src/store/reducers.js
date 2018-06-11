import { combineReducers } from 'redux'

import * as ActionTypes from './actions'

function report(state=null, action) {
	switch (action.type) {
	case ActionTypes.SET_REPORT:
		return action.payload
	default:
		return state
	}
}

const globalError = (state=null, action) => {
	if (action.type === ActionTypes.SET_GLOBAL_ERROR) {
		return action.error
	}

	return state
}

const rootReducer = combineReducers({
	report,
	globalError
})

export default rootReducer
