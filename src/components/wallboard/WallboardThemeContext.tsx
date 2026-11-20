import { createContext, useContext, type ReactNode } from 'react';
import {
  paletteFor,
  type WallboardPalette,
  type WallboardThemeMode,
} from './wallboard-theme';

type WallboardThemeContextValue = {
  theme: WallboardThemeMode;
  palette: WallboardPalette;
};

const WallboardThemeContext = createContext<WallboardThemeContextValue>({
  theme: 'light',
  palette: paletteFor('light'),
});

export function WallboardThemeProvider({
  theme,
  children,
}: {
  theme: WallboardThemeMode;
  children: ReactNode;
}) {
  return (
    <WallboardThemeContext.Provider
      value={{ theme, palette: paletteFor(theme) }}>
      {children}
    </WallboardThemeContext.Provider>
  );
}

export function useWallboardPalette(): WallboardThemeContextValue {
  return useContext(WallboardThemeContext);
}
