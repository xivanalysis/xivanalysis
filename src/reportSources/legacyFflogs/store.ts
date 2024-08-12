import {computed, toJS} from 'mobx'
import {Pull, Actor} from 'report'
import {isDefined} from 'utilities'
import {ReportStore, FetchOptions} from '../base'
import {adaptEvents} from './eventAdapter'
import fflogsIcon from './fflogs.png'
import {getFflogsEvents} from './fflogsApi'
import {reportStore as legacyReportStore} from './legacyStore'
import {adaptReport} from './reportAdapter'

/**
 * Report source acting as an adapter to the old report store system while we port
 * the rest of the analysis logic across.
 */
export class LegacyFflogsReportStore extends ReportStore {
	@computed
	override get report() {
		// If the report hasn't finished loading yet, bail early
		const report = legacyReportStore.report
		if (report?.loading !== false) {
			return
		}

		return adaptReport(report)
	}

	requestReport(code: string) {
		// Pass through directly to the legacy store. It handles caching for us.
		legacyReportStore.fetchReportIfNeeded(code)
	}

	override requestPulls(options?: FetchOptions) {
		// `fetchReport` gets the full set of pulls for us, only fire fetches
		// if bypassing the cache.
		if (options?.bypassCache !== true) { return }

		legacyReportStore.refreshReport()
	}

	override requestActors(_pullId: Pull['id'], options?: FetchOptions) {
		// Same story as requestPulls
		if (options?.bypassCache !== true) { return }

		legacyReportStore.refreshReport()
	}

	// todo: clean up
	override async fetchEvents(pullId: Pull['id']) {
		if (this.report == null) {
			// todo: wait for report?
			throw new Error('no report')
		}

		// Clone the report - if the user navigates in a way that clears the legacy store before the fetch is complete,
		// using the computed report directly will cause a race condition.
		const report = toJS(this.report)

		// Dig into the fflogs report data to build the request
		const legacyReport = report.meta
		const legacyFight = legacyReport.fights.find(fight => fight.id.toString() === pullId)
		const pull = report.pulls.find(pull => pull.id === pullId)
		if (legacyFight == null || pull == null) {
			throw new Error('no fight')
		}

		// Request the full event set & adapt to xiva events
		const legacyEvents = await getFflogsEvents(
			legacyReport,
			legacyFight,
		)

		const firstEvent = legacyReport.start + legacyFight.start_time
		return adaptEvents(report, pull, legacyEvents, firstEvent)
	}

	override getReportLink(pullId?: Pull['id'], actorId?: Actor['id']) {
		if (this.report == null) {
			return
		}

		let url = `https://www.fflogs.com/reports/${this.report.meta.code}`

		const params = [
			pullId && `fight=${pullId}`,
			actorId && `source=${actorId}`,
		].filter(isDefined)

		if (params.length > 0) {
			url = `${url}#${params.join('&')}`
		}

		return {
			icon: fflogsIcon,
			name: 'FF Logs',
			url,
		}
	}
}
