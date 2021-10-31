import {TimerGauge} from 'parser/core/modules/Gauge'
import Parser from 'parser/core/Parser'

jest.mock('parser/core/Parser')
const MockedParser = Parser as jest.Mock<Parser>

/* eslint-disable @typescript-eslint/no-magic-numbers */

describe('TimerGauge', () => {
	let currentTimestamp: number
	const timestampHooks: Array<{timestamp: number}> = []
	let parser: Parser
	let addTimestampHook: jest.Mock
	let removeTimestampHook: jest.Mock
	let gauge: TimerGauge

	beforeEach(() => {
		currentTimestamp = 100
		parser = new MockedParser()
		Object.defineProperty(parser, 'currentTimestamp', {
			get: () => currentTimestamp,
		})
		Object.defineProperty(parser, 'pull', {
			get: () => ({timestamp: 0, duration: 1000}),
		})
		Object.defineProperty(parser, 'eventTimeOffset', {
			get: () => 0,
		})

		addTimestampHook = jest.fn().mockImplementation(() => {
			const hook = {timestamp: currentTimestamp}
			timestampHooks.push(hook)
			return hook
		})
		removeTimestampHook = jest.fn()

		gauge = new TimerGauge({
			maximum: 100,
			parser,
		})
		gauge.setAddTimestampHook(addTimestampHook)
		gauge.setRemoveTimestampHook(removeTimestampHook)
	})

	it('defaults to no duration remaining', () => {
		expect(gauge.remaining).toBe(0)
	})

	it('calculates the correct remaining duration', () => {
		gauge.set(100)
		expect(gauge.remaining).toBe(100)

		currentTimestamp += 50
		expect(gauge.remaining).toBe(50)

		currentTimestamp += 100
		expect(gauge.remaining).toBe(0)
	})

	it('handles timestamp hooks correctly', () => {
		gauge.set(100)
		expect(removeTimestampHook).not.toHaveBeenCalled()
		expect(addTimestampHook).toHaveBeenCalledTimes(1)
		expect(addTimestampHook.mock.calls[0][0]).toBe(200)

		currentTimestamp += 50
		gauge.set(100)
		expect(removeTimestampHook).toHaveBeenCalledTimes(1)
		expect(removeTimestampHook.mock.calls[0][0]).toEqual(timestampHooks[0])
		expect(addTimestampHook).toHaveBeenCalledTimes(2)
		expect(addTimestampHook.mock.calls[1][0]).toBe(250)
	})

	it('pauses and resumes', () => {
		gauge.set(100)

		currentTimestamp += 50
		expect(gauge.remaining).toBe(50)

		gauge.pause()
		currentTimestamp += 200
		expect(gauge.remaining).toBe(50)

		gauge.resume()
		currentTimestamp += 25
		expect(gauge.remaining).toBe(25)
	})
})
