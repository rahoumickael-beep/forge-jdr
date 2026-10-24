// Pages communes aux trois livres.
import { CHARTES } from "../../shared/charte";
import { MONDE } from "./monde";
import { esc } from "./texte";

export const CREDITS_SRD = (titre: string) => `<div class="credits"><div>
  <h2>${esc(titre)}</h2>
  <p class="center">${MONDE.campagne} · un monde pour la cinquième édition</p>
  <div class="orn">${CHARTES[MONDE.genre].ornements.fin}</div>
  <p class="center">Conception, monde et règles : Mickael et sa table.<br>Illustrations : peintures générées avec Flux Schnell, choisies et retouchées à la main.</p>
  <div class="legal">
    <p>Ce livre utilise le Document de référence du système 5.1 (« SRD 5.1 ») de Wizards of the Coast LLC, disponible sur https://dnd.wizards.com/resources/systems-reference-document. Le SRD 5.1 est publié sous licence Creative Commons Attribution 4.0 International, consultable sur https://creativecommons.org/licenses/by/4.0/legalcode.</p>
    <p>${MONDE.nom}, ses lieux, ses peuples, ses créatures, ses classes propres et ses personnages sont des créations originales.</p>${MONDE.genre === "contemporain" ? `
    <p>Hermès est ici un nom de code de fiction. Le Service, les sociétés et les personnes de ce livre sont inventés : aucun lien avec une marque, une entreprise ou une administration existante.</p>` : ""}
  </div>
</div></div>`;
