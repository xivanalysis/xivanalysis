import {useParams, Redirect, useLocation} from 'react-router-dom'
import {parseInput} from './parseInput'

interface ReportRedirectParams {
	input: string
}

export const ReportRedirect = () => {
	const {input} = useParams<ReportRedirectParams>()
	const location = useLocation()

	const fullInput = `${input}${location.search}${location.hash}`

	const result = parseInput(fullInput)

	// TODO: Handle errors more gracefully?
	return result.valid
		? <Redirect to={result.path}/>
		: <Redirect to="/"/>
}
