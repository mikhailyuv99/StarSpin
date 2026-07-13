import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Bricolage_Grotesque,
  Bruno_Ace,
  DM_Sans,
  Fredoka,
  Baloo_2,
  Nunito,
  Rubik,
  Comfortaa,
} from "next/font/google";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  preload: false,
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  preload: false,
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  preload: false,
});

const wordmarkFont = Bruno_Ace({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-wordmark",
  preload: false,
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  preload: false,
});

const gameFont = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-game",
  preload: false,
});

const gameFontCyrillic = Comfortaa({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["600", "700"],
  variable: "--font-game-cyrillic",
  preload: false,
});

const bodyRu = Nunito({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body-ru",
  preload: false,
});

const displayRu = Rubik({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
  variable: "--font-display-ru",
  preload: false,
});

const bodyVi = Nunito({
  subsets: ["latin", "vietnamese", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body-vi",
  preload: false,
});

const displayVi = Baloo_2({
  subsets: ["latin", "vietnamese", "latin-ext"],
  weight: ["600", "700", "800"],
  variable: "--font-display-vi",
  preload: false,
});

const gameVi = Baloo_2({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  variable: "--font-game-vi",
  preload: false,
});

/** Font CSS variables for marketing/dashboard — never imported by QR journey routes. */
export const siteFontClassName = [
  plexSans.variable,
  plexMono.variable,
  display.variable,
  wordmarkFont.variable,
  bodyFont.variable,
  gameFont.variable,
  gameFontCyrillic.variable,
  bodyRu.variable,
  displayRu.variable,
  bodyVi.variable,
  displayVi.variable,
  gameVi.variable,
].join(" ");
