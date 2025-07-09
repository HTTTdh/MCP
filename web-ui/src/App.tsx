// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login.tsx";
import LoginSuccess from "./LoginSuccess.tsx";
import Home from "./Home.tsx";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-success" element={<LoginSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}
