// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMessage } from "../hooks/useMessage";
import axios from "../axios";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const { setUser } = useAuth();
  const { showMessage } = useMessage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("/user/login", form, {
        withCredentials: true,
      });

      if (res.status === 200) {
        const data = res.data;
        setUser(data.user);
        navigate("/rooms");
        showMessage(data.message, "success");
      }
    } catch (error) {
      showMessage(error.response?.data?.message || "Login failed", "error");
    }
  };

  return (
    <>
        <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          type="email"
          required
          autoComplete="email"
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password"
          required
          autoComplete="current-password"
        />
        <button type="submit">Login</button>
      </form>
    </>
  );
};

export default Login;
