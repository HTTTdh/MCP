// web-ui/src/Login.tsx
import { useEffect, useCallback, useState } from "react";

export default function GoogleLoginButton() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser]   = useState<any>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== import.meta.env.VITE_BACKEND_URL) return;
    if (!event.data?.token) return;

    setToken(event.data.token);
    setUser(event.data.user);
    localStorage.setItem("jwt", event.data.token);
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const login = () => {
    const backend = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";
    window.location.href = `${backend}/auth/google`; 
  };

  return (
    <>
      <button onClick={login}>Đăng nhập Google</button>
      {user && <pre>{JSON.stringify({ token, user }, null, 2)}</pre>}
    </>
  );
}
