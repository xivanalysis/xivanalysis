import _ from 'lodash'

const MINIMUM_SPEED_STAT = 380
const BASE_GCD = 2500
const GCD_PRECISION = 10

const BASE_SPEED_STAT = 304
const SPEED_MULTIPLIER = 10.15

export function getSpeedStat(gcd: number): number {
	const calculatedSpeed = _.ceil(BASE_SPEED_STAT + SPEED_MULTIPLIER * (BASE_GCD - gcd))

	return Math.max(calculatedSpeed, MINIMUM_SPEED_STAT)
}

export function getGCD(speedStat: number): number {
	const calculatedGcd = _.ceil(BASE_GCD - (speedStat - BASE_SPEED_STAT) / SPEED_MULTIPLIER, GCD_PRECISION)

	return Math.min(calculatedGcd, BASE_GCD)
}
