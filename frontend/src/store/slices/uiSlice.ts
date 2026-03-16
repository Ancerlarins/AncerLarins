import { createSlice } from '@reduxjs/toolkit';

interface UIState {
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  filterSheetOpen: boolean;
}

const initialState: UIState = {
  mobileMenuOpen: false,
  searchOpen: false,
  filterSheetOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMobileMenu(state) {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    closeMobileMenu(state) {
      state.mobileMenuOpen = false;
    },
    toggleSearch(state) {
      state.searchOpen = !state.searchOpen;
    },
    toggleFilterSheet(state) {
      state.filterSheetOpen = !state.filterSheetOpen;
    },
    closeFilterSheet(state) {
      state.filterSheetOpen = false;
    },
  },
});

export const { toggleMobileMenu, closeMobileMenu, toggleSearch, toggleFilterSheet, closeFilterSheet } = uiSlice.actions;
export default uiSlice.reducer;
