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
};

export default nextConfig;
