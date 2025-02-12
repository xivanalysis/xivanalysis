import {useParams, useLocation, Navigate} from 'react-router-dom'
import {parseInput} from './parseInput'

interface ReportRedirectParams {
	input: string
}

export function ReportRedirect() {
	const {input} = useParams<ReportRedirectParams>()
	const location = useLocation()

	const fullInput = `${input}${location.search}${location.hash}`

	const result = parseInput(fullInput)

	// TODO: Handle errors more gracefully?
	const target = result.valid? result.path : '/'
	return <Navigate to={target} replace={true}/>
}
