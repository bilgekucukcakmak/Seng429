// src/pages/LoginPage.jsx - Hesap Oluşturma Linki ve Kontrolleri

import { useState } from "react";
import "../styles/login.css";
import { loginRequest, setAuthToken } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function LoginPage({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("doctor");
    const [error, setError] = useState("");

    // --- KVKK ve RECAPTCHA STATE'LERİ ---
    const [kvkkConfirmed, setKvkkConfirmed] = useState(false);
    const [recaptchaPassed, setRecaptchaPassed] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // --- KVKK VE RECAPTCHA KONTROLÜ ---
        if (!kvkkConfirmed) {
            setError("Giriş yapmadan önce KVKK metnini onaylamanız gerekmektedir.");
            return;
        }

        if (!recaptchaPassed) {
            setError("Lütfen robot olmadığınızı onaylayın.");
            return;
        }

        if (!username || !password) {
            setError("Lütfen tüm alanları doldurun.");
            return;
        }

        try {
            const user = await loginRequest(username, password, role);

            // Kullanıcı bilgilerini localStorage'a kaydetme
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('username', username);

            setError("");

            if (onLogin) {
                onLogin(user);
            } else {
                 switch (user.role) {
                    case 'admin':
                        navigate('/admin');
                        break;
                    case 'doctor':
                        navigate('/doctor');
                        break;
                    case 'patient':
                        navigate('/patient');
                        break;
                    default:
                        navigate('/');
                }
            }

        } catch (err) {
            setError(err.message || "Giriş başarısız. Kullanıcı adı, şifre veya rol yanlış.");
        }
    };

    // --- YÖNLENDİRME FONKSİYONU ---
    const handleRegisterClick = (e) => {
        e.preventDefault();
        navigate('/register');
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">Giriş Yap</h1>

                {/* ================ GİRİŞ YAP FORMU ================== */}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Kullanıcı Adı (E-posta)</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
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

                    {/* HATA MESAJI */}
                    {error && <p className="error-text" style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

                    {/* =============== KONTROL GRUBU =============== */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>

                        {/* 1. "Ben Robot Değilim" Kontrolü */}
                        <div className="recaptcha-field">
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px',
                                    border: '1px solid #ccc',
                                    borderRadius: '5px',
                                    backgroundColor: '#f9f9f9',
                                    width: '240px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setRecaptchaPassed(!recaptchaPassed)}
                            >
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    border: '2px solid #aaa',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: recaptchaPassed ? '#28a745' : 'transparent'
                                }}>
                                    {recaptchaPassed && <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>✓</span>}
                                </div>
                                <span style={{ marginLeft: '8px', fontSize: '14px' }}>Ben robot değilim</span>
                            </div>
                        </div>

                        {/* 2. KVKK Onay Kontrolü */}
                        <div className="checkbox-field" style={{ flexDirection: 'row', alignItems: 'center', width: '240px', justifyContent: 'center' }}>
                            <input
                                type="checkbox"
                                id="kvkk_check"
                                checked={kvkkConfirmed}
                                onChange={() => setKvkkConfirmed(!kvkkConfirmed)}
                            />
                            <label htmlFor="kvkk_check" style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 'normal', color: '#555' }}>
                                <span style={{fontWeight: 'bold', color: '#f2c94c'}}>KVKK</span> metni okudum.
                            </label>
                        </div>
                    </div>

                    {/* GİRİŞ BUTONU */}
                    <button
                        type="submit"
                        className="login-button"
                        disabled={!kvkkConfirmed || !recaptchaPassed}
                        style={{
                            opacity: (!kvkkConfirmed || !recaptchaPassed) ? 0.6 : 1,
                            width: '100%'
                        }}
                    >
                        Giriş Yap
                    </button>
                </form>

                {/* ================ HESAP OLUŞTURMA YAZISI ================== */}
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#555' }}>
                        Hesabınız yok mu?
                        <a
                            href="/register"
                            onClick={handleRegisterClick}
                            style={{ marginLeft: '5px', color: '#f2c94c', fontWeight: 'bold', textDecoration: 'none' }}
                        >
                            Hesap oluşturun
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}