import {EventActor} from 'fflogs'
import {Actor} from 'report'

export function resolveActorId(opts: {
	id?: number | string,
	instance?: number,
	actor?: EventActor,
}): Actor['id'] {
	const idNum = (opts.id ?? opts.actor?.id ?? -1)
	const id = idNum === -1 ? 'unknown' : idNum.toString()
	const instance = opts.instance ?? 1
	return instance > 1
		? `${id}:${instance}`
		: id
}
