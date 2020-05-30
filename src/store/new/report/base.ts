import {Report, Pull} from './types'

export abstract class ReportStore {
	abstract readonly report?: Report

	// TODO: need some way to request refreshes. given that the refresh point is
	// in the "generic" section of the proposed flow, it likely needs to be representable in some manner at the generic report store level
	// perhaps reports should expose some metadata-esque stuff?
	// or, perhaps, given that it will likely be at the pulls and actors level,
	// it can be implemented with some options on the below?

	fetchPulls() {}
	fetchActors(pull: Pull) {} // pull id?
}
