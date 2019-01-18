import {combineReducers} from 'redux'

import * as ActionTypes from './actions'

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
	settings,
})

export default rootReducer
