import React, {useContext, createContext} from 'react'
import {ReportStore} from 'store/new/report'
import {Message} from 'akkd'

// TODO: I am _not_ convinced by needing the context. Think about it.
class NoOpReportStore extends ReportStore { report = undefined }
export const ReportStoreContext = createContext<ReportStore>(new NoOpReportStore())

export function ReportFlow() {
	const reportStore = useContext(ReportStoreContext)

	if (reportStore.report == null) {
		return (
			// TODO: i18n
			<Message error>
				TODO: Helpful error message about there being no report data found
			</Message>
		)
	}

	return <pre>{JSON.stringify(reportStore.report, undefined, 2)}</pre>
}
