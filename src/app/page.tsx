"use client";

import dynamic from "next/dynamic";
import { Providers } from "@/components/Providers";

const ConsoleDashboard = dynamic(() => import("@/components/ConsoleDashboard"), {
  ssr: false,
});

export default function Home() {
  return (
    <Providers>
      <ConsoleDashboard />
    </Providers>
  );
}



