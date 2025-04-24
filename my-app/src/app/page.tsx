"use client";

import { HomePage } from "./_components/home";
import { Debouncing } from "./_components/home/Debouncing";
import { Throttling } from "./_components/home/Throttling";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <HomePage />
      <Debouncing />
      <Throttling />
    </main>
  );
}
