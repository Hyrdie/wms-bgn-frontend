import { create } from 'zustand'

/** Backend `environment` query param; fixed default (no UI switcher). */
type EnvState = {
  environment: 'staging' | 'imple'
}

export const useEnvironmentStore = create<EnvState>(() => ({
  environment: 'staging',
}))
