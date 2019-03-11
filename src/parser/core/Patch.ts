import {GameEdition, getPatch, getPatchDate, PatchNumber} from 'data/PATCHES'
import {matchClosestLower} from 'utilities'

export class Patch {
	constructor(
		private readonly edition: GameEdition,
		private readonly timestamp: number,
	) {}

	get key() {
		return getPatch(this.edition, this.timestamp)
	}

	/**
	 * Compare the stored patch with the one specified. A negative, zero, or
	 * postive number will be returned if the patch is before, equal to, or
	 * after the stored patch, respectively.
	 * @param patch The patch to compare to
	 */
	compare(patch: PatchNumber) {
		const a = getPatchDate(this.edition, this.key)
		const b = getPatchDate(this.edition, patch)
		return b - a
	}

	/**
	 * Check if the specified patch is before the currently stored patch
	 * @param patch Patch to compare to
	 */
	before(patch: PatchNumber) {
		return this.compare(patch) < 0
	}

	/**
	 * Check if the specified patch is equal to the currently stored patch
	 * @param patch Patch to compare to
	 */
	is(patch: PatchNumber) {
		return this.compare(patch) === 0
	}

	/**
	 * Check if the specified patch is after the currently stored patch
	 * @param patch Patch to compare to
	 */
	after(patch: PatchNumber) {
		return this.compare(patch) > 0
	}

	/**
	 * Given a mapping between patches and values, find the value for the most recent
	 * patch for the currently stored timestamp, or undefined if no patch is early
	 * enough.
	 * @param values Patch => value mapping
	 */
	match<V>(values: Partial<Record<PatchNumber, V>>): V | undefined {
		const dateValues = Object.entries(values).reduce(
			(carry, [patch, value]) => {
				carry[getPatchDate(this.edition, patch as PatchNumber)] = value
				return carry
			},
			{} as Partial<Record<number, V>>,
		)
		return matchClosestLower(dateValues, getPatchDate(this.edition, this.key))
	}
}
