import {useRef, MutableRefObject} from 'react'

/**
 * Create a react ref, initiating it with the return value of the provided
 * initialisation function if not already set. This is essentially a work-around
 * for react's (current) lack of lazy execution of ref default values.
 */
export function useLazyRef<T>(init: () => T) {
	const ref = useRef<T | undefined>()
	if (ref.current == null) {
		ref.current = init()
	}
	return ref as MutableRefObject<T>
}
