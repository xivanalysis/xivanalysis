import {
	layers as actionLayers,
	root as actionRoot,
	ActionRoot,
} from 'data/ACTIONS'
import {getAppliedData} from 'data/layer'
import {Patch} from 'data/PATCHES'
import {
	layers as statusLayers,
	root as statusRoot,
	StatusRoot,
} from 'data/STATUSES'
import React, {createContext, ReactNode, useContext, useMemo} from 'react'

interface DataContextValue {
	actions: ActionRoot
	statuses: StatusRoot
}

const DataContext = createContext<DataContextValue>({
	actions: actionRoot,
	statuses: statusRoot,
})

export const useDataContext = () => useContext(DataContext)

export interface DataContextProviderProps {
	children?: ReactNode
	patch: Patch
}

export function DataContextProvider({
	children,
	patch,
}: DataContextProviderProps) {
	// TODO: This logic is effectively duplicated with the data module. Work out how to dedupe.
	const value = useMemo<DataContextValue>(
		() => ({
			actions: getAppliedData({
				root: actionRoot,
				layers: actionLayers,
				state: {patch},
			}),
			statuses: getAppliedData({
				root: statusRoot,
				layers: statusLayers,
				state: {patch},
			}),
		}),
		[patch]
	)

	return (
		<DataContext.Provider value={value}>
			{children}
		</DataContext.Provider>
	)
}
