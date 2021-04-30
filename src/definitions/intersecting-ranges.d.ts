declare module 'intersecting-ranges' {
	type Range = [start: number, end: number]
	type RangeWithData<T> = [..._: Range, data?: T]

	export interface IntersectingRangesOptions {
		/** Don't return the original ranges if there are no overlaps. */
		omitEmpty?: boolean
		/** Optionally store data for each range to be merged into the intersections. */
		withData?: boolean
	}

	function intersectingRanges<T, O extends IntersectingRangesOptions>(ranges: Array<RangeWithData<T>>, options?: O):
		true extends (undefined extends O['withData'] ? false : O['withData']) ? Array<RangeWithData<T>> : Range[]

	export default intersectingRanges
}
