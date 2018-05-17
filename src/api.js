import axios from 'axios'

const options = {
	baseURL: process.env.REACT_APP_LOGS_BASE_URL
}

if (process.env.REACT_APP_LOGS_API_KEY) {
	options.params = {
		api_key: process.env.REACT_APP_LOGS_API_KEY
	}
}

export const fflogsApi = axios.create(options)
