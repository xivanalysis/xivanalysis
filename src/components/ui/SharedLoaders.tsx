import {Trans} from '@lingui/react'
import {Loader} from 'semantic-ui-react'

export const ReportLoader = () => (
	<Loader active>
		<Trans id="ui.loading.report">
			Loading report
		</Trans>
	</Loader>
)

export const AnalysisLoader = () => (
	<Loader active>
		<Trans id="ui.loading.analysis">
			Loading analysis
		</Trans>
	</Loader>
)
