import { useState } from "react";
import "../styles/login.css";
import { loginRequest } from "../services/api";

export default function LoginPage({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("doctor");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();


        try {
            const user = await loginRequest(username, password, role);
            setError("");
            onLogin(user);
        } catch (err) {
            setError(err.message || "Giriş başarısız.");
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">Giriş Yap</h1>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Kullanıcı Adı</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Rol</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="doctor">Doktor</option>
                            <option value="patient">Hasta</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <button type="submit" className="login-button">
                        Giriş Yap
                    </button>
                </form>

                <p className="test-info">
                    Test: admin/1234 (admin) · doktor1/1234 (doctor) · hasta1/1234 (patient)
                </p>
            </div>
        </div>
    );
}
