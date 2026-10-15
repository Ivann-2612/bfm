"use client";

import { useEffect, useMemo, useState } from "react";

export default function KartePage() {
  const [key, setKey] = useState("");

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    setKey(hash.trim());
  }, []);

  const status = useMemo(() => {
    if (!key) return "Unesi ključ u URL-u kao #<ključ>";
    return `Ključ je prisutan: ${key.slice(0, 8)}...`;
  }, [key]);

  return (
    <main className="admin wrap" style={{ padding: "2rem 0" }}>
      <header className="admin__head">
        <div>
          <p className="kicker">Beogradski festival magije</p>
          <h1 className="section-title">Karte</h1>
        </div>
      </header>

      <p className="admin__empty">{status}</p>
      <p className="admin__hint">
        U produkciji se prijave učitavaju preko Supabase Edge Functions i
        zahteva se validan x-admin-key header.
      </p>
    </main>
  );
}
