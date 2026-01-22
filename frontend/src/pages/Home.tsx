import { Link } from "react-router-dom";
// import "./Home.css"; // optional (agar CSS alag rakhna chaho)

const Home = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "16px",
        background: "#0f172a",
        color: "#e5e7eb",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <h1 style={{ fontSize: "3rem", fontWeight: 700 }}>
        Realtime Whiteboard
      </h1>

      <p style={{ maxWidth: "520px", fontSize: "1.1rem", opacity: 0.9 }}>
        Draw, brainstorm, and collaborate with your team in real-time.
        Simple tools. Zero friction.
      </p>

      <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
        <Link to="/login">
          <button
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: "#2563eb",
              color: "white",
              fontSize: "1rem",
            }}
          >
            Sign in
          </button>
        </Link>

        <Link to="/signup">
          <button
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid #2563eb",
              cursor: "pointer",
              background: "transparent",
              color: "#2563eb",
              fontSize: "1rem",
            }}
          >
            Get started
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
