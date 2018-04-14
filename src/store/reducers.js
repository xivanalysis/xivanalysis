import { combineReducers } from 'redux'
import { SET_REPORT } from './actions'

function report(state=null, action) {
	switch (action.type) {
	case SET_REPORT:
		return action.payload
	default:
		return state
	}
}

const rootReducer = combineReducers({
	report
})

export default rootReducer
