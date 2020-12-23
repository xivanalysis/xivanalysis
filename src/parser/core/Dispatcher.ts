import {Event} from 'event'
import {Injectable} from './Injectable'

type Handle = (typeof Injectable)['handle']

export class Dispatcher {
	dispatch(event: Event, handles: Handle[]) {}
}
