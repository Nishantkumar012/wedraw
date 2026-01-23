import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

type SigninResponse = {
  token: string;
};

const BACKEND = import.meta.env.VITE_BACKEND_URL;


export default function Signin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BACKEND}/user/login`, {
        method: "POST",
         
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!res.ok) {
        throw new Error("Signin failed");
      }

      const data: SigninResponse = await res.json();

      // // store token
      // localStorage.setItem("token", data.token);

       // token only exists in DEV
  localStorage.setItem("token", data.token);


      // redirect to rooms
      navigate("/rooms");
    } catch (err) {
      setError("Invalid credentials or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#020617",
        color: "#e5e7eb",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <h2 style={{ fontSize: "1.8rem", fontWeight: 600 }}>
          Sign in
        </h2>

        {error && (
          <div style={{ color: "#f87171", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "8px",
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            background: "#2563eb",
            color: "white",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
          Don’t have an account?{" "}
          <Link to="/signup" style={{ color: "#60a5fa" }}>
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #1e293b",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: "0.95rem",
};
