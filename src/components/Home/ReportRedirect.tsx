import React from 'react'
import {useParams, Redirect} from 'react-router-dom'
import {parseInput} from './parseInput'

interface ReportRedirectParams {
	input: string
}

export const ReportRedirect = () => {
	const {input} = useParams<ReportRedirectParams>()

	const result = parseInput(input)

	// TODO: Handle errors more gracefully?
	return result.valid
		? <Redirect to={result.path}/>
		: <Redirect to="/"/>
}
