const validEnvironmentKey = /^REACT_APP_/i

export const getReactAppEnvironment = () =>
	Object.keys(process.env)
		.filter(key => validEnvironmentKey.test(key))
		.reduce((env, key) => {
			env[key] = JSON.stringify(process.env[key])
			return env
		}, {})
