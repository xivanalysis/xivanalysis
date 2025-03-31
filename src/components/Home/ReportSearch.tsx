import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {NormalisedMessage} from 'components/ui/NormalisedMessage'
import {observer} from 'mobx-react'
import {ChangeEvent, useCallback, useState} from 'react'
import {Navigate} from 'react-router-dom'
import {SearchHandlerResult} from 'reportSources'
import {Button, Input, InputOnChangeData} from 'semantic-ui-react'
import {parseInput} from './parseInput'
import styles from './ReportSearch.module.css'

const DEFAULT_REASON = msg({id: 'core.home.report-search.unknown-query-error', message: 'An unknown error occured when parsing the provided query.'})

type InputState = {
	value: string,
	result: SearchHandlerResult,
}

export const ReportSearch = observer(function ReportSearch() {
	const [{value, result}, setState] = useState<InputState>({
		value: '',
		result: {valid: false},
	})

	const onChange = useCallback((event: ChangeEvent, {value}: InputOnChangeData) => {
		const result = parseInput(value)
		setState({value, result})
	}, [])

	if (result.valid) {
		return <Navigate to={result.path} replace={false}/>
	}

	// Any valid searches will have already been redirected by now, so the only
	// non-erroneous state is a blank one.
	const hasErrors = value !== ''

	return (
		<>
			<strong>
				{hasErrors ? (
					<span className="text-error">
						<NormalisedMessage message={result.reason ?? DEFAULT_REASON}/>
					</span>
				) : (
					<Trans id="core.home.paste-url">
                            Paste your log URL to get started
					</Trans>
				)}
			</strong>
			<Input
				type="text"
				placeholder="https://www.fflogs.com/reports/..."
				action={(
					// No onClick on this - you can't realistically click it if there's a valid input, as it will have already redirected out.
					(<Button negative={hasErrors}>
						<Trans id="core.home.analyse">Analyse</Trans>
					</Button>)
				)}
				onChange={onChange}
				className={styles.input}
				inverted
				error={hasErrors}
			/>
		</>
	)
})
