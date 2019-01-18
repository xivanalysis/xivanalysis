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
