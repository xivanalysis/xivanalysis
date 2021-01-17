import {filter, oneOf} from '../filter'

/* eslint-disable @typescript-eslint/no-magic-numbers */

type TestShape = typeof testShape
const testShape = {
	example: 'value',
	second: 1,
}

describe('filter', () => {
	it('accepts matching shapes', () => {
		const testFilter = filter<TestShape>()
			.example('value')

		expect(testFilter(testShape)).toBeTrue()
		expect(testFilter({...testShape, second: 42})).toBeTrue()
	})

	it('rejects non-matching shapes', () => {
		const testFilter = filter<TestShape>()
			.example('will not match')

		expect(testFilter(testShape)).toBeFalse()
		// @ts-expect-error Only possible in JS context
		expect(testFilter({})).toBeFalse()
	})

	it('accepts any shape when empty', () => {
		const testFilter = filter<TestShape>()

		expect(testFilter(testShape)).toBeTrue()
		// @ts-expect-error Only possible in JS context
		expect(testFilter({})).toBeTrue()
	})

	it('delegates to provided matchers', () => {
		let called = false
		const testFilter = filter<TestShape>()
			.example((input): input is 'value' => {
				called = true
				return input === 'value'
			})

		expect(called).toBeFalse()
		expect(testFilter(testShape)).toBeTrue()
		expect(called).toBeTrue()
	})
})

describe('matchers', () => {
	test('oneOf', () => {
		const matcher = oneOf(1, 2)
		expect(matcher(1)).toBeTrue()
		expect(matcher(2)).toBeTrue()
		expect(matcher(3)).toBeFalse()
	})
})
