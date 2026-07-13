import {createContext, useContext} from 'react'

export interface ModuleExpansionContextValue {
	expanded: boolean
}

const ModuleExpansionContext = createContext<ModuleExpansionContextValue>({
	expanded: false,
})

export const ModuleExpansionProvider = ModuleExpansionContext.Provider
export const ModuleExpansionConsumer = ModuleExpansionContext.Consumer
export const useModuleExpansion = () => useContext(ModuleExpansionContext)
