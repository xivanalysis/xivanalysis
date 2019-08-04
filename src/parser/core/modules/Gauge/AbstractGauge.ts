// TODO: If this doesn't end up with any shared impl bullshit, just turn it into an interface or something
export abstract class AbstractGauge {
	/** Reset any values stored within the gauge to their initial state. */
	abstract reset(): void
}
