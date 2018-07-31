import {createStore, applyMiddleware} from 'redux'
import thunkMiddleware from 'redux-thunk'

import {loadState, saveState} from './storage'

import reducers from './reducers'

function configureStore(preloadedState) {
	const store = createStore(
		reducers,
		preloadedState,
		applyMiddleware(
			thunkMiddleware
		)
	)

	store.subscribe(() => {
		saveState(store.getState())
	})

	return store
}

export default configureStore(loadState())
