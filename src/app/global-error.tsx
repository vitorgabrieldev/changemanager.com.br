"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#fdf6e3",
          color: "#073642",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 380, textAlign: "center", padding: 32 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Algo deu muito errado
          </h1>
          <p style={{ color: "#586e75", marginBottom: 16 }}>
            A aplicação encontrou um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 16px",
              borderRadius: 4,
              border: "1px solid #e4ddc7",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
