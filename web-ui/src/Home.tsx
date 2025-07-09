// src/Home.tsx
import { useEffect, useState } from "react";

interface JwtPayload {
  [key: string]: unknown;        // email, name, exp, ...
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [payload, setPayload] = useState<JwtPayload | null>(null);

  useEffect(() => {
    // 1. Lấy token
    const stored = localStorage.getItem("jwt");
    setToken(stored);

    // 2. Giải mã payload nếu có
    if (stored) {
      try {
        const [, payloadBase64] = stored.split(".");
        // base64url → base64
        const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        setPayload(JSON.parse(json));
      } catch (err) {
        console.error("Could not decode JWT payload:", err);
      }
    }
  }, []);

  if (!token) {
    return <p>Chưa có token – hãy <a href="/login">đăng nhập</a>.</p>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Thông tin JWT</h1>

      <h3>Raw token:</h3>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {token}
      </pre>

      {payload && (
        <>
          <h3>Payload (decoded):</h3>
          <pre>{JSON.stringify(payload, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
