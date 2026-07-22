import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sortie autonome : produit un serveur minimal (.next/standalone) idéal
  // pour un déploiement Docker/Coolify — image légère, pas besoin de tout
  // node_modules au runtime.
  output: "standalone",
  images: {
    // Les images du site sont déjà des .webp pré-dimensionnées : on sert les
    // originaux tels quels. Évite la dépendance sharp au runtime et rend le
    // déploiement sur VPS totalement sans configuration.
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

export default nextConfig;
