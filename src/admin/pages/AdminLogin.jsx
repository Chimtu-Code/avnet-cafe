import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

const ADMIN_EMAIL = "sushanth211107@gmail.com";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email === ADMIN_EMAIL) {
        navigate("/admin");
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user?.email === ADMIN_EMAIL) {
        localStorage.setItem("isAdmin", "true");
        navigate("/admin");
      } else {
        setError("Unauthorized: Not an admin account");
        await supabase.auth.signOut();
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .admin-login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          font-family: 'Poppins', sans-serif;
          padding: 1rem;
        }

        .login-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 2.5rem;
          width: 100%;
          max-width: 400px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #000;
          margin-bottom: 0.5rem;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: #666;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #333;
        }

        .form-input {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 0.875rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #000;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.875rem;
          text-align: center;
        }

        .login-btn {
          background: #000;
          color: white;
          border: none;
          padding: 0.875rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          font-family: inherit;
        }

        .login-btn:hover:not(:disabled) {
          background: #333;
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <div className="admin-login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/cafe-logo.svg" alt="Logo" className="login-logo" />
            <h2 className="login-title">Admin Login</h2>
            <p className="login-subtitle">Enter your credentials to continue</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;