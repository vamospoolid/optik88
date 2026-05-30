import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VenueInfo {
  namaOptik: string;
  alamat: string;
  telepon: string;
  whatsapp: string;
  email: string;
  instagram: string;
  tagline: string;
}

interface SettingsState {
  // Google Drive
  gdrivePrescriptionUrl: string;
  setGdrivePrescriptionUrl: (url: string) => void;

  // Venue / Toko
  venue: VenueInfo;
  setVenue: (v: Partial<VenueInfo>) => void;

  // WhatsApp number untuk pesan langsung
  waNumber: string;
  setWaNumber: (n: string) => void;

  // Bluetooth printer name yang terpilih
  btPrinterName: string;
  btPrinterConnected: boolean;
  setBtPrinter: (name: string, connected: boolean) => void;
}

const defaultVenue: VenueInfo = {
  namaOptik: 'Optik88',
  alamat: '',
  telepon: '',
  whatsapp: '',
  email: '',
  instagram: '',
  tagline: 'Solusi Kacamata & Rekam Medis',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      gdrivePrescriptionUrl: '',
      setGdrivePrescriptionUrl: (url) => set({ gdrivePrescriptionUrl: url }),

      venue: defaultVenue,
      setVenue: (v) => set((s) => ({ venue: { ...s.venue, ...v } })),

      waNumber: '',
      setWaNumber: (n) => set({ waNumber: n }),

      btPrinterName: '',
      btPrinterConnected: false,
      setBtPrinter: (name, connected) => set({ btPrinterName: name, btPrinterConnected: connected }),
    }),
    { name: 'optik88-settings' }
  )
);
