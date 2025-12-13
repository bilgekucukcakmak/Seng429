// src/pages/RegisterPage.jsx - SADECE HASTA KAYDI İÇİN

import { useState } from "react";
import "../styles/login.css"; // Aynı stilleri kullanıyoruz
import { register as registerUser } from "../services/api"; // API fonksiyonunu isimlendirerek içe aktar
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
    const [form, setForm] = useState({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "patient", // Rolü otomatik olarak HASTA yapıyoruz.
        specialization: "" // Hastalar için boş kalacak.
    });
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        try {
            // Şifre kontrolü, alan doldurma kontrolü gibi validasyonlar eklenebilir.
            if (!form.email || !form.password || !form.first_name || !form.last_name) {
                setMessage({ type: 'error', text: 'Lütfen tüm alanları doldurun.' });
                return;
            }

            // API çağrısı: Rol zaten form state'inde "patient" olarak ayarlı
            await registerUser(form);

            setMessage({ type: "success", text: "Hesabınız başarıyla oluşturuldu! Yönlendiriliyorsunuz..." });

            // Başarılı kayıttan sonra giriş sayfasına yönlendir
            setTimeout(() => {
                navigate('/login'); // <-- /login rotasına yönlendirme
            }, 2000);

        } catch (error) {
            setMessage({ type: 'error', text: 'Kayıt başarısız oldu: ' + (error.response?.data || 'Sunucu hatası.') });
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">Hasta Kayıt Formu</h1>

                {message && (
                    <p style={{ color: message.type === 'error' ? 'red' : 'green', fontWeight: 'bold', marginBottom: '15px' }}>
                        {message.text}
                    </p>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Ad</label>
                        <input type="text" name="first_name" value={form.first_name} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Soyad</label>
                        <input type="text" name="last_name" value={form.last_name} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>E-posta (Kullanıcı Adı)</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Şifre</label>
                        <input type="password" name="password" value={form.password} onChange={handleChange} required />
                    </div>

                    {/* Rol alanı kaldırıldı, çünkü daima "patient" */}

                    <button type="submit" className="login-button" style={{ marginTop: '20px' }}>
                        Hesabı Oluştur
                    </button>
                </form>

                {/* Giriş Sayfasına Geri Dönme Linki */}
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#555' }}>
                        Zaten hesabınız var mı?
                        <Link to="/login" style={{ marginLeft: '5px', color: '#f2c94c', fontWeight: 'bold', textDecoration: 'none' }}>
                            Giriş yapın
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}