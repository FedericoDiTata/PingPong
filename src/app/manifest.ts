import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ping Pong · la liga",
    short_name: "Ping Pong",
    description: "Ranking, historial y estadísticas de los partidos de ping pong entre amigos.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1b2a63",
    theme_color: "#1b2a63",
    lang: "es-AR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
