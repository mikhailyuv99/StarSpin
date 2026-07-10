import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "STARSPIN",
    short_name: "STARSPIN",
    description: "Google reviews and prize wheel for restaurants and shops.",
    start_url: "/",
    display: "standalone",
    background_color: "#ff9dc4",
    theme_color: "#ff9dc4",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
