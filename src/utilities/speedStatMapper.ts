import {BASE_GCD} from 'data/CONSTANTS'

/* eslint-disable @typescript-eslint/no-magic-numbers */

// NOTE: The location of these constants (and indeed, the logic below), must be kept up to date in `docs/patch-checklist.md`.

export const SUB_ATTRIBUTE_MINIMUM = 400

const STAT_DIVISOR = 1900

export function getSpeedStat(estimatedGcd: number): number {
	return Math.floor(1/130 * STAT_DIVISOR * (1000 - (1000 * estimatedGcd) / BASE_GCD) + SUB_ATTRIBUTE_MINIMUM)
}

export function getEstimatedTime(speedStat: number, baseDuration: number): number {
	const {floor} = Math

	// This formula is effectively 1:1 with calculations found in both Allagan
	// Studies documentation and Orinx's speed calculator.
	// TODO: Move to speed adjustments module and/or hook up remaining inputs.

	// Personal speed buffs, as a %. i.e. Huton is 15 for this value.
	const selfBuff = 0
	// Explicit haste stat, as direct state value.
	const haste = 0
	// BLM opposite-aspect multiplier. 100 for same asepct, 50 for opposite.
	const astralUmbral = 100

	// The base multiplier influenced by the user's speed attributes
	const attributeMultiplier = 1000 - floor(130 * (speedStat - SUB_ATTRIBUTE_MINIMUM) / STAT_DIVISOR)

	// Duration calculation, split for ease of reading.
	const adjustedDuration = floor(attributeMultiplier * baseDuration / 1000)
	const hasteMultiplier = floor(floor(100 - selfBuff) * (100 - haste) / 100)
	const finalDuration = floor(floor(adjustedDuration * hasteMultiplier / 1000) * astralUmbral / 100)

	// Formula calculates centiseconds, bump that down to milliseconds for consistency with xiva.
	return finalDuration * 10
}
