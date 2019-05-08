import {Fflogs} from '@xivanalysis/parser-reader-fflogs'
import {AxiosRequestConfig} from 'axios'

export interface ReportFightsQuery extends AxiosRequestConfig {
	params?: {
		translate?: boolean,
		// This is only a thing when hitting an instance of @xivanalysis/server
		bypassCache?: boolean,
	}
}

export type ReportFightsResponse = Fflogs.Report

export interface ReportEventsQuery extends AxiosRequestConfig {
	params?: {
		start?: number,
		end?: number,
		actorid?: Fflogs.Actor['id'],
		actorinstance?: number,
		actorclass?: Fflogs.ActorType,
		cutoff?: number,
		encounter?: Fflogs.Fight['boss'],
		wipes?: number,
		difficulty?: number,
		filter?: string,
		translate?: boolean,
	}
}

export interface ReportEventsResponse {
	events: Fflogs.Event[]
	nextPageTimestamp?: number
}
