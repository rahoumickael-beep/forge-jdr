// Code du maître du jeu : chargé à part (React.lazy, voir chargerMJ dans Table.tsx), dans des fichiers mj-*.js
// que le serveur ne sert qu'avec la clé du MJ. Tout ce qui lit les secrets (bestiaire, bibliothèque, canon,
// générateurs de scénario) passe par ici : la table des joueurs ne l'importe jamais.
// scripts/verifier-secrets-client.ts contrôle le site fabriqué.
import type { RoomView } from "../../../shared/types";
import { CampagnePanel } from "./CampagnePanel";
import { BestiaryPanel, CombatPanel, GeneratePanel, MapPanel, NotesPanel, ScenariosPanel, SettingsPanel, TokensPanel } from "./GmPanels";
import { VaisseauxMJ } from "./Vaisseau";

export { PiocheMJ } from "./PiocheMJ";

export function PanneauMJ({ room, tab, selectedId, onSelect }: { room: RoomView; tab: string; selectedId: string | null; onSelect: (id: string | null) => void }) {
  return (
    <>
      {tab === "Générer" && <GeneratePanel room={room} />}
      {tab === "Carte" && <MapPanel room={room} />}
      {tab === "Pions" && <TokensPanel room={room} selectedId={selectedId} onSelect={onSelect} />}
      {tab === "Bestiaire" && <BestiaryPanel room={room} />}
      {tab === "Combat" && <CombatPanel room={room} />}
      {tab === "Scénarios" && <ScenariosPanel room={room} />}
      {tab === "Narration" && <NotesPanel room={room} />}
      {tab === "Campagne" && <CampagnePanel room={room} />}
      {tab === "Vaisseaux" && <VaisseauxMJ room={room} />}
      {tab === "Réglages" && <SettingsPanel room={room} />}
    </>
  );
}
