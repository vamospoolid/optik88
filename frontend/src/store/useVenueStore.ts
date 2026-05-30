import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VenueProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  city: string;
  instagram: string;
  notes: string; // catatan footer invoice
}

interface VenueStore {
  venue: VenueProfile;
  setVenue: (data: Partial<VenueProfile>) => void;
  resetVenue: () => void;
}

const defaultVenue: VenueProfile = {
  name: 'Optik 88',
  tagline: 'Solusi Kacamata & Pemeriksaan Mata Terpercaya',
  address: 'Jl. Raya No. 88',
  phone: '021-888888',
  whatsapp: '6281234567890',
  email: 'optik88@email.com',
  website: '',
  city: 'Jakarta',
  instagram: '',
  notes: 'Terima kasih atas kepercayaan Anda. Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
};

export const useVenueStore = create<VenueStore>()(
  persist(
    (set) => ({
      venue: defaultVenue,
      setVenue: (data) =>
        set((state) => ({ venue: { ...state.venue, ...data } })),
      resetVenue: () => set({ venue: defaultVenue }),
    }),
    {
      name: 'optik88-venue', // key di localStorage
    }
  )
);
