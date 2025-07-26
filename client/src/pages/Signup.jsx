// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMessage } from "../hooks/useMessage";
import axios from "../axios";

const Signup = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const { showMessage } = useMessage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("/user/signup", form, {
        withCredentials: true,
      });

      if (res.status === 201) {
        const data = res.data;
        navigate("/login");
        showMessage(data.message, "success");
      }
    } catch (error) {
      showMessage(error.response?.data?.message || "Signup failed", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign Up</h2>
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Name"
        required
        autoComplete="name"
      />
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
        minLength="6"
        required
        autoComplete="new-password"
      />
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default Signup;
