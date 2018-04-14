import axios from 'axios'

// TODO: API Key should probably be proxied before this hits prod

export const fflogsApi = axios.create({
	baseURL: 'https://www.fflogs.com/v1/',
	params: {
		api_key: process.env.REACT_APP_LOGS_API_KEY
	}
})
