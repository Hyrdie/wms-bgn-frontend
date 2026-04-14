import { create } from 'zustand'

type EnvState = {
  environment: 'staging' | 'imple'
  setEnvironment: (value: 'staging' | 'imple') => void
}

export const useEnvironmentStore = create<EnvState>((set) => ({
  environment: 'staging',
  setEnvironment: (value) => set({ environment: value }),
}))
