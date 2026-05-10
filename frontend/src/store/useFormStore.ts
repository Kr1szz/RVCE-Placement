import { create } from 'zustand'
import { useAuthStore } from './useAuthStore'
import type { PlacementFormSummary, PlacementFormDetail } from '../api/types'

interface FormState {
  forms: PlacementFormSummary[] | null
  loading: boolean
  error: string | null

  // Actions
  fetchForms: () => Promise<void>
  getFormDetails: (formId: number) => Promise<PlacementFormDetail>
  submitResponse: (
    formId: number, 
    answers: Record<number, string | number | boolean>
  ) => Promise<void>
}

export const useFormStore = create<FormState>((set, get) => ({
  forms: null,
  loading: false,
  error: null,

  fetchForms: async () => {
    if (!get().forms) set({ loading: true })
    set({ error: null })
    try {
      const repo = useAuthStore.getState().repo
      const forms = await repo.getAssignedForms()
      set({ forms, loading: false })
    } catch (e) {
      set({ 
        error: e instanceof Error ? e.message : String(e), 
        loading: false 
      })
    }
  },

  getFormDetails: async (formId) => {
    const repo = useAuthStore.getState().repo
    return await repo.getForm(formId)
  },

  submitResponse: async (formId, answers) => {
    try {
      const repo = useAuthStore.getState().repo
      await repo.submitFormResponses(formId, answers)
      
      // Refresh the forms list to update the 'responseCount' badge
      const forms = await repo.getAssignedForms()
      set({ forms })
    } catch (e) {
      throw e
    }
  },
}))
