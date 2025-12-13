// src/App.jsx - ROL TABANLI YÖNLENDİRME VE KAYIT ROTASI

import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";

// SAYFA BİLEŞENLERİ
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage"; // <-- Kayıt sayfası dahil edildi
import DoctorPage from "./pages/DoctorPage";
import PatientPage from "./pages/PatientPage";
import AdminPage from "./pages/AdminPage";

// API VE AUTH UTILS
import { initializeAuthToken, setAuthToken } from "./services/api";

/* ---------------- APP CONTENT (Routing ve Yetkilendirme Mantığı) ---------------- */

const AppContent = ({ user, setUser, handleLogout }) => {
    const navigate = useNavigate();

    const handleLoginSuccess = (user) => {
        setUser(user);

        // Kullanıcı rolüne göre ana sayfaya yönlendirme
        switch (user.role) {
            case "admin":
                navigate("/admin");
                break;
            case "doctor":
                navigate("/doctor");
                break;
            case "patient":
                navigate("/patient");
                break;
            default:
                // Tanımsız rol durumunda, login sayfasına yönlendir
                navigate("/login");
        }
    };

    /* -------- PROTECTED ROUTE (Koruma Rotası) -------- */
    const ProtectedRoute = ({ element: Element, allowedRoles }) => {
        // 1. Giriş kontrolü (Token veya user yoksa)
        if (!user) {
            // LoginPage'e yönlendir
            return <Navigate to="/login" replace />;
        }

        // 2. Rol kontrolü
        if (!allowedRoles.includes(user.role)) {
            // Yetkisiz erişim durumunda hata mesajı
            return (
                <div style={{ textAlign: "center", padding: "100px" }}>
                    <h1>403 – Erişim Reddedildi</h1>
                    <p>Bu sayfaya erişim yetkiniz bulunmamaktadır ({user.role}).</p>
                </div>
            );
        }

        // 3. Başarılı: İlgili Bileşeni render et
        return <Element user={user} onLogout={handleLogout} />;
    };

    return (
        <Routes>
            {/* Giriş Rotası: Hem anasayfa hem de /login URL'ini karşılar */}
            <Route path="/" element={<Navigate to="/login" replace />} /> {/* Anasayfadan /login'e yönlendir */}
            <Route path="/login" element={<LoginPage onLogin={handleLoginSuccess} />} />

            {/* Kayıt Rotası (Koruma Gerektirmez) */}
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin Rotası */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute
                        element={AdminPage}
                        allowedRoles={["admin"]}
                    />
                }
            />

            {/* Doktor Rotası (Adminler de erişebilir) */}
            <Route
                path="/doctor"
                element={
                    <ProtectedRoute
                        element={DoctorPage}
                        allowedRoles={["doctor", "admin"]}
                    />
                }
            />

            {/* Hasta Rotası (Adminler de erişebilir) */}
            <Route
                path="/patient"
                element={
                    <ProtectedRoute
                        element={PatientPage}
                        allowedRoles={["patient", "admin"]}
                    />
                }
            />

            {/* Tanımsız Sayfa (404) */}
            <Route
                path="*"
                element={
                    <h1 style={{ textAlign: "center", padding: "100px" }}>
                        404 – Sayfa Bulunamadı
                    </h1>
                }
            />
        </Routes>
    );
};

/* ---------------- MAIN APP (Auth State ve Token Kontrolü) ---------------- */

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Uygulama yüklendiğinde localStorage'da token ve kullanıcı bilgisi kontrolü
        const tokenExists = initializeAuthToken();

        if (tokenExists) {
            const role = localStorage.getItem("userRole");
            const id = localStorage.getItem("userId");
            const username = localStorage.getItem("username");

            if (role && id && username) {
                // Bilgiler doğruysa kullanıcıyı state'e yükle
                setUser({
                    id,
                    role,
                    username,
                });
            } else {
                // Token var ama diğer bilgiler eksik/bozuksa temizle
                handleLogout();
            }
        }

        setLoading(false);
    }, []);

    const handleLogout = () => {
        // Kullanıcı state'ini ve tüm yerel depolamayı temizle
        setUser(null);
        setAuthToken(null);

        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                Uygulama Yükleniyor...
            </div>
        );
    }

    return (
        <AppContent
            user={user}
            setUser={setUser}
            handleLogout={handleLogout}
        />
    );
}

export default App;