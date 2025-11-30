import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { Login, Register } from "./components/AuthForms";
import Books from "./components/Books";
import { useState } from "react";
import Cookies from "js-cookie";

const App = () => {
  // Renamed to 'isAuthenticated' for clarity.
  // If token exists, true. If not, false.
  const [isAuthenticated, setIsAuthenticated] = useState(!!Cookies.get("auth_token"));
  const [role, setRole] = useState(Cookies.get("user_role") || "");
  const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove("auth_token");
    Cookies.remove("user_role");
    setIsAuthenticated(false);
    navigate("/login"); // Redirect to login after logout
  };

  // --- INLINE STYLES ---
  const styles = {
    nav: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "15px 30px",
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #e0e0e0",
      marginBottom: "30px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    brand: {
      textDecoration: "none",
      color: "#333",
      fontSize: "1.5rem",
      fontWeight: "bold",
    },
    linkContainer: {
      display: "flex",
      gap: "20px",
      alignItems: "center",
    },
    link: {
      textDecoration: "none",
      color: "#555",
      fontSize: "1rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "color 0.2s",
    },
    buttonLink: {
      textDecoration: "none",
      backgroundColor: "#333",
      color: "#fff",
      padding: "8px 16px",
      borderRadius: "4px",
      fontSize: "0.9rem",
      cursor: "pointer",
    }
  };

  return (
    <>
      <nav style={styles.nav}>
        {/* Left Side: Logo/Brand */}
        <Link to="/" style={styles.brand}>
          Library App
        </Link>

        {/* Right Side: Links */}
        <div style={styles.linkContainer}>
          <Link to="/home" style={styles.link}>Home</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/books" style={styles.link}>My Books</Link>
              <span 
                onClick={handleLogout} 
                style={styles.buttonLink}
              >
                Logout
              </span>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>Login</Link>
              <Link to="/register" style={styles.buttonLink}>Register</Link>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        <Routes>
          <Route path="/" element={<h1>Welcome to the Library</h1>} />
          <Route path="/home" element={<><h1>Home Page of {role}</h1>{role === 'admin' && <h4>only admin can upload books, authors, tags, and categories.</h4>}</>} />
          {/* Pass setIsAuthenticated so Login component can update the navbar state */}
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/books" element={<Books />} />
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </div>
    </>
  );
};

export default App;