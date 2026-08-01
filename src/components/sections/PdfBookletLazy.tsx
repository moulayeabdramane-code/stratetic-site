"use client";

import dynamic from "next/dynamic";

// react-pdf touche des API navigateur (Canvas, DOMMatrix) au chargement du module :
// le composant doit rester hors du rendu serveur. `ssr: false` ne peut être appelé
// que depuis un Client Component, d'où cette petite coquille dédiée.
export const PdfBooklet = dynamic(
  () => import("./PdfBooklet").then((m) => m.PdfBooklet),
  { ssr: false }
);
