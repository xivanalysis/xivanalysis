import {getDataBy, getDataArrayBy} from '../getDataBy'

const ExampleData = {
	ONE: {value: 'one', arr: [0, 1, 2, 3, 4]},
	TWO: {value: 'two', arr: [10, 11, 12, 13, 14]},
	THREE: {value: 'same', arr: []},
	FOUR: {value: 'same', arr: []},
}

describe('DATA', () => {
	describe('getDataBy', () => {
		it('performs correct lookups', () => {
			expect(getDataBy(ExampleData, 'value', 'one')).toBe(ExampleData.ONE)
		})

		it('performs lookups on array values', () => {
			expect(getDataBy(ExampleData, 'arr', 13)).toBe(ExampleData.TWO)
		})

		it('falls back when no match is found', () => {
			expect(getDataBy(ExampleData, 'value', 'three')).toBeUndefined()
		})
	})

	describe('getDataArrayBy', () => {
		it('returns all matching data entries', () => {
			expect(getDataArrayBy(ExampleData, 'value', 'same'))
				.toContain(ExampleData.THREE)
				.toContain(ExampleData.FOUR)
		})
	})
})
