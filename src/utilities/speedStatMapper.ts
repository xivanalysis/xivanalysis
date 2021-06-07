/* eslint-disable @typescript-eslint/no-magic-numbers */
export const SUB_ATTRIBUTE_MINIMUM = 380
const BASE_GCD = 2500

const STAT_DIVISOR = 3300

export function getSpeedStat(estimatedGcd: number): number {
	return Math.floor(1/130 * STAT_DIVISOR * (1000 - (1000 * estimatedGcd) / BASE_GCD) + SUB_ATTRIBUTE_MINIMUM)
}

export function getEstimatedTime(speedStat: number, baseDuration: number): number {
	const speedScale = Math.floor(130 * (speedStat - SUB_ATTRIBUTE_MINIMUM) / STAT_DIVISOR + 1000)

	return Math.floor((2000 - speedScale) / 1000 * baseDuration)
}
