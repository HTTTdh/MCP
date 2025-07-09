// LoginSuccess.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("jwt", token);
      // TODO: Gọi API /me để lấy thông tin user nếu cần
      navigate("/"); // chuyển về trang chính
    }
  }, []);

  return <p>Đăng nhập thành công, đang chuyển hướng...</p>;
}
