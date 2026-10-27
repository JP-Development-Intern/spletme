import spotifyLogo from "@/assets/images/logo/spotify.svg";
import youtubeLogo from "@/assets/images/logo/youtube.svg";
import metaLogo from "@/assets/images/logo/meta.svg";
import appleMusicLogo from "@/assets/images/logo/apple-music-glyph.svg";
import deezerLogo from "@/assets/images/logo/deezer.svg";
import tiktokLogo from "@/assets/images/logo/tiktok.svg";

export interface PlatformBrand {
  color: string;
  letter: string;
  logo?: string;
}

/**
 * Cada plataforma con su color de marca: es como se reconocen de un vistazo,
 * sin tener que leer el nombre. Las claves son los nombres tal como llegan en
 * los reportes de los distribuidores.
 */
export const PLATFORM_BRAND: Record<string, PlatformBrand> = {
  "Spotify": { color: "#1DB954", letter: "S", logo: spotifyLogo },
  "Apple Music": { color: "#FA243C", letter: "A", logo: appleMusicLogo },
  "YouTube Official Content": { color: "#FF0000", letter: "Y", logo: youtubeLogo },
  "YouTube UGC": { color: "#FF0000", letter: "Y", logo: youtubeLogo },
  "Deezer": { color: "#A238FF", letter: "D", logo: deezerLogo },
  "Amazon Premium": { color: "#00A8E1", letter: "A" },
  "Amazon Ad-Supported": { color: "#00A8E1", letter: "A" },
  "Facebook / Instagram": { color: "#E4405F", letter: "F", logo: metaLogo },
  "iMusica": { color: "#FF6B35", letter: "I" },
  "Yandex": { color: "#FFCC00", letter: "Y" },
  "iTunes Match": { color: "#FA243C", letter: "I" },
  "Audiomack": { color: "#FFA200", letter: "A" },
  "TikTok": { color: "#010101", letter: "T", logo: tiktokLogo },
  "Otros": { color: "#71757E", letter: "O" },
};

export const platformBrand = (name: string): PlatformBrand =>
  PLATFORM_BRAND[name] ?? PLATFORM_BRAND.Otros;

/** Luminancia relativa aproximada de un color hex (0 = negro, 1 = blanco). */
export const luminance = (hex: string): number => {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Color de la plataforma sobre una superficie oscura. TikTok es negro y sobre
 * el vidrio de noche desaparecería: ahí va en blanco, que es como la propia
 * marca se pinta en modo oscuro.
 */
export const platformColorOnDark = (name: string): string => {
  const { color } = platformBrand(name);
  return luminance(color) < 0.05 ? "#FFFFFF" : color;
};
