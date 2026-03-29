import { create } from 'zustand';

interface AuthState {
    isAuthenticated: boolean;
    userToken: string | null;
    guestToken: string | null;
    login: (token: string) => void;
    setGuestToken: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: !!localStorage.getItem('userToken') || !!sessionStorage.getItem('guestToken'),
    userToken: localStorage.getItem('userToken'),
    guestToken: sessionStorage.getItem('guestToken'),

    login: (token) => {
        localStorage.setItem('userToken', token);
        set({ isAuthenticated: true, userToken: token });
    },

    setGuestToken: (token) => {
        sessionStorage.setItem('guestToken', token);
        set({ isAuthenticated: true, guestToken: token });
    },

    logout: () => {
        localStorage.removeItem('userToken');
        sessionStorage.removeItem('guestToken');
        set({ isAuthenticated: false, userToken: null, guestToken: null });
    }
}));
