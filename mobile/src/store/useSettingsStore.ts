import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  gdrivePrescriptionUrl: string;
  setGdrivePrescriptionUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      gdrivePrescriptionUrl: '',
      setGdrivePrescriptionUrl: (url) => set({ gdrivePrescriptionUrl: url }),
    }),
    {
      name: 'optik88-settings',
    }
  )
);
