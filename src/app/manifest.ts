import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mesa · liga de ping pong",
    short_name: "Mesa",
    description:
      "Ranking, historial y estadísticas de los partidos de ping pong entre amigos.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#131620",
    theme_color: "#131620",
    lang: "es-AR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
