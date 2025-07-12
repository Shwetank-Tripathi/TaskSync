// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "../axios";

const Signup = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("/user/signup", form, {
        withCredentials: true,
      });

      if (res.status === 201) {
        const verify = await axios.get("/user/verify", {
          withCredentials: true,
        });
        const data = verify.data;
        if (data.isLoggedIn) {
          setUser(data.user);
          navigate("/rooms");
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || "Signup failed";
      alert(message);
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
