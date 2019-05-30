import {getDataBy} from './getDataBy'

const ExampleData = {
	ONE: {value: 'one'},
	TWO: {value: 'two'},
}

describe('DATA', () => {
	describe('getDataBy', () => {
		it('performs correct lookups', () => {
			expect(getDataBy(ExampleData, 'value', 'one')).toBe(ExampleData.ONE)
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
