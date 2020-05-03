import {getDataBy} from '../getDataBy'

// tslint:disable no-magic-numbers

const ExampleData = {
	ONE: {value: 'one', arr: [0, 1, 2, 3, 4]},
	TWO: {value: 'two', arr: [10, 11, 12, 13, 14]},
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

		it('errors when an invalid `by` is passed', () => {
			function erraneousCall() {
				// Need to disable TS for the next line - the mistake is only possible in JS
				// @ts-ignore
				getDataBy(ExampleData, 'invalid', 'one')
			}
			expect(erraneousCall).toThrowError('invalid')
		})
	})
})
