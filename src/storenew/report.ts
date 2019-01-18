import {fflogsApi} from 'api'
import {AxiosResponse} from 'axios'
import * as Errors from 'errors'
import {ReportFightsQuery, ReportFightsResponse} from 'fflogs'
import {action, observable, runInAction} from 'mobx'
import {globalErrorStore} from 'storenew/globalError'

interface UnloadedReport {
	loading: true
}
export interface LoadedReport extends ReportFightsResponse {
	code: string
	loading: false
}
export type Report = UnloadedReport | LoadedReport

export class ReportStore {
	@observable report?: Report

	@action
	private async fetchReport(code: string, params?: ReportFightsQuery['params']) {
		this.report = {loading: true}

		let response: AxiosResponse<ReportFightsResponse>
		try {
			response = await fflogsApi.get<ReportFightsResponse>(`/report/fights/${code}`, {
				params: {
					translate: true,
					...params,
				},
			})
		} catch (e) {
			// Something's gone wrong, clear report status then dispatch an error
			runInAction(() => {
				this.report = undefined
			})

			// TODO: Probably need more handling than this...
			if (e.response && e.response.data.error === 'This report does not exist or is private.') {
				globalErrorStore.setGlobalError(new Errors.ReportNotFoundError())
			} else {
				globalErrorStore.setGlobalError(new Errors.UnknownApiError())
			}
			return
		}

		// Save out the report
		runInAction(() => {
			this.report = {
				...response.data,
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
