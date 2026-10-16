import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // Sortie autonome : produit un serveur minimal (.next/standalone) idéal
  // pour un déploiement Docker/Coolify — image légère, pas besoin de tout
  // node_modules au runtime.
  output: "standalone",
  // sharp (utilisé par Payload pour les médias de l'admin) charge libvips en
  // bibliothèque native : le traçage de Next ne la voit pas et le serveur
  // autonome plante au démarrage. On embarque donc tous les binaires @img.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@img/**/*"],
  },
  images: {
    // Les images du site sont déjà des .webp pré-dimensionnées : on sert les
    // originaux tels quels (pas d'optimisation next/image au runtime).
    unoptimized: true,
  },
  async headers() {
    // Cache long + immutable pour les assets médias : un visiteur qui revient
    // (souvent en 3G au Niger) ne retélécharge plus rien. Si un visuel doit
    // changer un jour, changer son nom de fichier plutôt que son contenu.
    const immutable = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ];
    return [
      { source: "/images/:path*", headers: immutable },
      { source: "/scroll-world/:path*", headers: immutable },
      { source: "/videos/:path*", headers: immutable },
      { source: "/brand/:path*", headers: immutable },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
