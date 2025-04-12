import {useParams, useLocation, Navigate} from 'react-router-dom'
import {parseInput} from './parseInput'

export function ReportRedirect() {
	const {['*']: input} = useParams()
	const location = useLocation()

	const fullInput = `${input}${location.search}${location.hash}`

	const result = parseInput(fullInput)

	// TODO: Handle errors more gracefully?
	const target = result.valid? result.path : '/'
	return <Navigate to={target} replace={true}/>
}
