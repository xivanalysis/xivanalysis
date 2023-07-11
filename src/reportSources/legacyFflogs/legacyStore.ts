import * as Sentry from '@sentry/browser'
import * as Errors from 'errors'
import ky from 'ky'
import _ from 'lodash'
import {action, observable, runInAction} from 'mobx'
import {globalErrorStore} from 'store/globalError'
import {settingsStore} from 'store/settings'
import {ProcessedReportFightsResponse, ReportFightsQuery, ReportFightsResponse} from './eventTypes'
import {fetchFflogs, getCache} from './fflogsApi'

interface UnloadedReport {
	loading: true
}
export interface Report extends ProcessedReportFightsResponse {
	code: string
	loading: false
}
export type PossiblyLoadedReport = UnloadedReport | Report

interface ErrorResponse {
	status: number
	error: string
}

export class ReportStore {
	@observable report?: PossiblyLoadedReport

	@action
	clearReport() {
		this.report = undefined
	}

	@action
	private async fetchReport(code: string, params?: ReportFightsQuery) {
		this.report = {loading: true}

		const bypassCache =
			(params && params.bypassCache) || settingsStore.bypassCacheNextRequest
		settingsStore.setBypassCacheNextRequest(false)

		let response: ReportFightsResponse
		try {
			let cache : Cache | undefined
			try {
				cache = await getCache(code)
			} catch (error) {
				Sentry.captureException(error)
				cache = undefined
			}
			response = await fetchFflogs<ReportFightsResponse>(
				`report/fights/${code}`,
				{
					translate: 'true',
					..._.omitBy(params, _.isNil),
				},
				cache,
				bypassCache ? 'bypass' : 'read',
			)
		} catch (e) {
			// Something's gone wrong, clear report status then dispatch an error
			runInAction(() => {
				this.report = undefined
			})

			// TODO: Add more error handling to this if they start cropping up more
			if (e instanceof Errors.UnknownApiError && e.inner instanceof ky.HTTPError) {
				const json: ErrorResponse | undefined = await e.inner.response.json().catch(_err => undefined)
				if (json && json.error === 'This report does not exist or is private.') {
					globalErrorStore.setGlobalError(new Errors.ReportNotFoundError())
					return
				}
			}

			if (e instanceof Errors.GlobalError) {
				globalErrorStore.setGlobalError(e)
				return
			}

			globalErrorStore.setGlobalError(new Errors.UnknownApiError({inner: e}))
			return
		}

		// Report is still processing - clear the state and error
		if (
			response.processing
			|| response.enemies == null
			|| response.fights == null
			|| response.friendlies == null
			|| response.lang == null
		) {
			runInAction(() => this.report = undefined)
			globalErrorStore.setGlobalError(new Errors.ReportProcessingError())
			settingsStore.setBypassCacheNextRequest(true)
			return
		}

		// Save out the report. Assignment because >ts
		const processedResponse = response
		runInAction(() => {
			this.report = {
				...processedResponse,
				code,
				loading: false,
			}
		})
	}

	fetchReportIfNeeded(code: string) {
		if (this.report && (this.report.loading || code === this.report.code)) { return }
		this.fetchReport(code)
	}

	refreshReport() {
		if (!this.report || this.report.loading) { return }
		this.fetchReport(this.report.code, {bypassCache: true})
	}
}

export const reportStore = new ReportStore()
