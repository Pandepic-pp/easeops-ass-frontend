import { useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const baseURL = "https://easeops-assignment.onrender.com/api/auth";

const Login = ({setIsLogin}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${baseURL}/login`, {
                email, password
            });
            const { accessToken, role } = response.data;
            Cookies.set("auth_token", accessToken);
            Cookies.set("user_role", role);
            navigate("/books");
            setIsLogin(false);
            console.log("Login successful, token stored in cookies.");
        } catch (error) {
            console.error("Login failed:", error);
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <h2>Login</h2>
            <input type="email" placeholder="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit">Login</button>
        </form>
    )
}

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${baseURL}/register`, {
                email, password
            });
            console.log("Registration successful.");
            navigate("/login");
        } catch (error) {
            console.error("Login failed:", error);
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <h2>Register</h2>
            <input type="email" placeholder="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit">Login</button>
        </form>
    )
}

export { Login, Register };