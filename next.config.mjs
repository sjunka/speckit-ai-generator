import { networkInterfaces } from "node:os";

// Dev server prints its LAN address as "Network: http://<ip>:3000" — read
// the same address here instead of hardcoding it, so it tracks whatever
// network the machine is on.
const lanIPs = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i.family === "IPv4" && !i.internal)
  .map((i) => i.address);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: lanIPs,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
