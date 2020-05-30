import React, {useRef, MutableRefObject, createContext, useContext} from 'react'
import {useRouteMatch, Switch, Route, Redirect, useParams} from 'react-router-dom'
import {ReportStore, FflogsLegacyReportStore} from 'store/new/report'
import {observer} from 'mobx-react'
import {Loader} from 'semantic-ui-react'

// TODO: this should be somewhere else, probably alongside the reportflow
class NoOpReportStore extends ReportStore { report = undefined }
const ReportStoreContext = createContext<ReportStore>(new NoOpReportStore())

interface RouteParams {
	code: string
}

export function FflogsLegacy() {
	const {path} = useRouteMatch()
	return (
		<Switch>
			{/* Can't do anything without a report code, redirect to the home page */}
			<Redirect path={path} exact to="/"/>

			<Route path={`${path}/:code`} component={WithCode}/>
		</Switch>
	)
}

const WithCode = observer(function WithCode() {
	const {code} = useParams<RouteParams>()

	const reportStore = useLazyRef(() => new FflogsLegacyReportStore()).current
	reportStore.fetchReport(code)

	// We can safely assume that a null report means we're loading due to the  legacy store semantics.
	if (reportStore.report == null) {
		return (
			<Loader active>
				{/* TODO: Trans */}
				Loading report
			</Loader>
		)
	}

	return (
		<ReportStoreContext.Provider value={reportStore}>
			<ReportFlow/>
		</ReportStoreContext.Provider>
	)
})

// TODO: this is obviously not going to live here
function ReportFlow() {
	const reportStore = useContext(ReportStoreContext)

	if (reportStore.report == null) {
		return <>TODO: YOU DONE FUCKED UP</>
	}

	return <pre>{JSON.stringify(reportStore.report, undefined, 2)}</pre>
}

// TODO: put this in utilities or something
function useLazyRef<T>(init: () => T) {
	const ref = useRef<T | undefined>()
	if (ref.current == null) {
		ref.current = init()
	}
	return ref as MutableRefObject<T>
}
