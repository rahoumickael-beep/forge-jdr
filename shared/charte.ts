// Charte graphique de chaque genre : une seule source pour l'appli, les livres et les prompts d'illustration.
// L'appli reprend ces valeurs dans client/src/themes.css (un test vérifie qu'elles concordent),
// les livres (scripts/livres) et ComfyUI les lisent directement.
import type { GenreId } from "./types";

/** Ce qu'on peint : chaque cadrage garde le même style, seul le sujet change. */
export type Cadrage = "creature" | "portrait" | "scene" | "objet" | "couverture";

export interface Charte {
  genre: GenreId;
  /** Nom de la direction artistique, montré au MJ. */
  nom: string;
  /** Tant que Mickael n'a pas choisi le style de ce genre. */
  provisoire?: boolean;
  /** Prompt de style pour Flux. {support}, {cadrage} et {lumiere} sont remplacés selon ce qu'on peint. */
  peinture: string;
  /** Lumière par défaut ; une famille de créatures ou un lieu peut imposer la sienne. */
  lumiere?: string;
  supports: Record<Cadrage, { support: string; cadrage: string }>;
  palette: {
    fond: string; // feutre de la table
    papier: string;
    papier2: string;
    filet: string; // traits fins, filets de tableau
    encre: string;
    encreDouce: string;
    or: string; // accent principal (laiton, néon…)
    sang: string; // titres, danger
  };
  polices: { titre: string; deco: string; texte: string; petitesCapitales: string };
  ornements: { chapitre: string; fin: string };
}

const fantasySupports: Charte["supports"] = {
  creature: { support: "bestiary plate", cadrage: "single creature shown full body, centered, eye-level view, uncluttered background" },
  portrait: { support: "character portrait", cadrage: "half-length portrait, three-quarter view, plain dark backdrop" },
  scene: { support: "rulebook plate", cadrage: "wide establishing scene, candlelight" },
  objet: { support: "rulebook plate", cadrage: "still life of a single object on dark cloth" },
  couverture: { support: "book cover painting", cadrage: "monumental composition, empty dark space at the top for the title" },
};

const supportsGeneriques = (support: string): Charte["supports"] => ({
  creature: { support: `${support} creature plate`, cadrage: "single creature study" },
  portrait: { support: `${support} character portrait`, cadrage: "half-length portrait, three-quarter view, plain backdrop" },
  scene: { support: `${support} illustration`, cadrage: "wide establishing scene" },
  objet: { support: `${support} illustration`, cadrage: "single object study" },
  couverture: { support: `${support} cover art`, cadrage: "monumental composition, empty space at the top for the title" },
});

export const CHARTES: Record<GenreId, Charte> = {
  fantasy: {
    genre: "fantasy",
    nom: "Peinture à l'huile, lumière de bougie",
    // Gabarit des planches : le retoucher oblige à repeindre les illustrations déjà faites.
    peinture: "oil painting on aged canvas, dark fantasy {support}, visible brush strokes, muted earth palette of umber, ochre and verdigris, dramatic chiaroscuro, {cadrage}, {lumiere}, painterly realism in the manner of 17th century Dutch masters, no text, no letters, no signature, no border, no frame, no watermark",
    lumiere: "warm candlelight from one side",
    supports: fantasySupports,
    palette: { fond: "#16201b", papier: "#efe2c2", papier2: "#e3d2a8", filet: "#b89a62", encre: "#2b1d0e", encreDouce: "#6b5232", or: "#d4a94c", sang: "#8f2a1f" },
    polices: { titre: "Cinzel", deco: "Cinzel Decorative", texte: "EB Garamond", petitesCapitales: "IM Fell English SC" },
    ornements: { chapitre: "✠", fin: "❦" },
  },
  "dark-fantasy": {
    genre: "dark-fantasy",
    nom: "Gravure à l'eau-forte, sang et cendre",
    provisoire: true,
    peinture: "dark etching with red ink wash, grim dark fantasy {support}, heavy crosshatching, ash grey and dried blood palette, {cadrage}, no text, no border, no watermark",
    supports: supportsGeneriques("grimdark"),
    palette: { fond: "#0f0d0d", papier: "#d8cfc0", papier2: "#c7bba7", filet: "#8c7a64", encre: "#1d1512", encreDouce: "#5a4a40", or: "#b8402f", sang: "#7a1d14" },
    polices: { titre: "Pirata One", deco: "Pirata One", texte: "Crimson Pro", petitesCapitales: "IM Fell English SC" },
    ornements: { chapitre: "✝", fin: "☩" },
  },
  "science-fiction": {
    genre: "science-fiction",
    nom: "Peinture de couverture des années 70",
    provisoire: true,
    peinture: "1970s science fiction paperback painting, {support}, airbrushed gouache, deep blues and warm highlights, grand scale, {cadrage}, no text, no border, no watermark",
    supports: supportsGeneriques("retro science fiction"),
    palette: { fond: "#060c18", papier: "#0f1d33", papier2: "#13284a", filet: "#2c5c9a", encre: "#d6ecff", encreDouce: "#7fa6cf", or: "#4cc3ff", sang: "#ff5c6c" },
    polices: { titre: "Exo 2", deco: "Exo 2", texte: "Exo 2", petitesCapitales: "Exo 2" },
    ornements: { chapitre: "◆", fin: "◇" },
  },
  cyberpunk: {
    genre: "cyberpunk",
    nom: "Néon sous la pluie, photographie de nuit",
    provisoire: true,
    peinture: "cinematic night photograph look, cyberpunk {support}, rain, neon magenta and cyan reflections, film grain, {cadrage}, no text, no border, no watermark",
    supports: supportsGeneriques("cyberpunk"),
    palette: { fond: "#0a0612", papier: "#140d24", papier2: "#1d1236", filet: "#ff2fa0", encre: "#f6e8ff", encreDouce: "#b493d4", or: "#ff2fa0", sang: "#ff3b3b" },
    polices: { titre: "Chakra Petch", deco: "Chakra Petch", texte: "Chakra Petch", petitesCapitales: "Chakra Petch" },
    ornements: { chapitre: "▚", fin: "▞" },
  },
  horreur: {
    genre: "horreur",
    nom: "Photographie argentique années 20",
    provisoire: true,
    peinture: "1920s silver gelatin photograph, cosmic horror {support}, sepia and grey, vignetting, scratches and dust, {cadrage}, no text, no border, no watermark",
    supports: supportsGeneriques("archival horror"),
    palette: { fond: "#0c0d0b", papier: "#e4dcc4", papier2: "#d6ccb0", filet: "#9a8f70", encre: "#1c1a14", encreDouce: "#5d5744", or: "#a8b07a", sang: "#7a1f1f" },
    polices: { titre: "Special Elite", deco: "Special Elite", texte: "Crimson Pro", petitesCapitales: "Special Elite" },
    ornements: { chapitre: "※", fin: "†" },
  },
  "post-apo": {
    genre: "post-apo",
    nom: "Affiche au pochoir, rouille et poussière",
    provisoire: true,
    peinture: "gritty gouache painting, post-apocalyptic {support}, rust orange and dust palette, harsh sun, {cadrage}, no text, no border, no watermark",
    supports: supportsGeneriques("wasteland"),
    palette: { fond: "#17130d", papier: "#d9c7a0", papier2: "#c9b48a", filet: "#8f7650", encre: "#241a0d", encreDouce: "#6a5536", or: "#e0782a", sang: "#a8331c" },
    polices: { titre: "Stardos Stencil", deco: "Stardos Stencil", texte: "Oswald", petitesCapitales: "Oswald" },
    ornements: { chapitre: "☢", fin: "✕" },
  },
  western: {
    genre: "western",
    nom: "Peinture de l'Ouest à la Remington",
    provisoire: true,
    peinture: "oil painting in the style of 19th century American western art, {support}, golden dust light, ochre and sage palette, {cadrage}, no text, no border, no watermark",
    supports: supportsGeneriques("frontier"),
    palette: { fond: "#1c130c", papier: "#ecd5a8", papier2: "#e0c48e", filet: "#a07a44", encre: "#2e1a0a", encreDouce: "#74512a", or: "#d8963c", sang: "#9a2f1a" },
    polices: { titre: "Rye", deco: "Rye", texte: "Crimson Pro", petitesCapitales: "Playfair Display SC" },
    ornements: { chapitre: "✶", fin: "✦" },
  },
  pirates: {
    genre: "pirates",
    nom: "Marine à l'huile du XVIIIe siècle",
    provisoire: true,
    peinture: "18th century maritime oil painting, pirate {support}, stormy sea light, teal and brass palette, {cadrage}, no text, no border, no watermark",
    supports: supportsGeneriques("golden age of piracy"),
    palette: { fond: "#08161f", papier: "#ead8ae", papier2: "#dcc490", filet: "#a3804a", encre: "#22180c", encreDouce: "#6a5230", or: "#d6b24a", sang: "#9a2a1a" },
    polices: { titre: "Pirata One", deco: "Pirata One", texte: "Cormorant Garamond", petitesCapitales: "IM Fell English SC" },
    ornements: { chapitre: "⚓", fin: "☠" },
  },
  steampunk: {
    genre: "steampunk",
    nom: "Gravure victorienne rehaussée",
    provisoire: true,
    peinture: "Victorian engraving with watercolor tint, steampunk {support}, brass and copper tones, fine linework, {cadrage}, no text, no border, no watermark",
    supports: supportsGeneriques("Victorian steampunk"),
    palette: { fond: "#17110c", papier: "#e8d8b8", papier2: "#d9c39a", filet: "#9c7a4a", encre: "#2a1a0c", encreDouce: "#6e5232", or: "#c98a3c", sang: "#8a2a1a" },
    polices: { titre: "Playfair Display SC", deco: "Playfair Display SC", texte: "Crimson Pro", petitesCapitales: "Playfair Display SC" },
    ornements: { chapitre: "⚙", fin: "❧" },
  },
  contemporain: {
    genre: "contemporain",
    nom: "Photo de dossier, flash et grain",
    provisoire: true,
    peinture: "candid documentary photograph, thriller {support}, direct flash, muted cold colors, 35mm grain, {cadrage}, no text, no border, no watermark",
    supports: supportsGeneriques("modern thriller"),
    palette: { fond: "#111417", papier: "#eceae4", papier2: "#dedbd2", filet: "#a8a49a", encre: "#18191b", encreDouce: "#5a5c60", or: "#d24a3a", sang: "#b0301f" },
    polices: { titre: "Oswald", deco: "Oswald", texte: "Source Sans 3", petitesCapitales: "Oswald" },
    ornements: { chapitre: "■", fin: "□" },
  },
};

export const charte = (genre: GenreId): Charte => CHARTES[genre];

/** Préfixe de style complet pour un genre et un cadrage. */
export function stylePeinture(genre: GenreId, cadrage: Cadrage, lumiere?: string): string {
  const c = CHARTES[genre];
  const s = c.supports[cadrage];
  const l = lumiere ?? c.lumiere;
  return c.peinture
    .replace("{support}", s.support)
    .replace("{cadrage}", s.cadrage)
    .replace(l ? "{lumiere}" : ", {lumiere}", l ?? "");
}

/** Prompt complet : style du genre, puis le sujet (en anglais pour Flux). */
export const promptPeinture = (genre: GenreId, cadrage: Cadrage, sujet: string, lumiere?: string) => `${stylePeinture(genre, cadrage, lumiere)}, ${sujet}`;
