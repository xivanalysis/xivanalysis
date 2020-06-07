import {Report, Pull} from 'report'

/**
 * Base ReportStore implementation, defining the report interface accessible to
 * most of the application. Source-specific implementation details are handled
 * exclusively by subclasses of this class and their respective component(s).
 */
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
