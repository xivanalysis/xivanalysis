import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import fs from 'fs'

// Load the environment files
const {NODE_ENV} = process.env
const envFile = '.env'
const envFiles = [
	`${envFile}.${NODE_ENV}.local`,
	`${envFile}.${NODE_ENV}`,
	NODE_ENV !== 'test' && `${envFile}.local`,
	envFile
].filter(Boolean)
envFiles.forEach(path => {
	if (!fs.existsSync(path)) { return }
	dotenvExpand(dotenv.config({path}))
})
