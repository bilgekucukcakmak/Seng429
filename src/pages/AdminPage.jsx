// src/pages/AdminPage.jsx (NİHAİ VE TAM HALİ - Ünvan Kolonu Eklendi)

import { useState, useEffect } from "react";
import "../styles/layout.css";
// API'ye updateDoctor fonksiyonunu eklediğinizi varsayıyoruz:
import { getAllUsers, deleteUser, register, updateDoctor, getSpecializations, getGeneralReports } from "../services/api";

export default function AdminPage({ user, onLogout }) {
    const [activeSection, setActiveSection] = useState("overview");

    // --- USERS & LOADING STATE'LERİ ---
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- CANLI VERİ STATE'LERİ ---
    const [specializations, setSpecializations] = useState([]);
    const [reports, setReports] = useState(null);

    // YENİ KULLANICI EKLEME İÇİN TEK BİR FORM KULLANIYORUZ
    const [registerForm, setRegisterForm] = useState({
        email: "",
        password: "",
        role: "doctor",
        first_name: "",
        last_name: "",
        specialization: "",
        title: "Dr.",
    });
    const [registerMessage, setRegisterMessage] = useState(null);

    // --- DÜZENLEME STATE'LERİ ---
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editMessage, setEditMessage] = useState(null);


    // ARAMA
    const [doctorSearch, setDoctorSearch] = useState("");
    const [patientSearch, setPatientSearch] = useState("");

    // Ünvan seçenekleri
    const titleOptions = ['Dr.', 'Doç. Dr.', 'Prof. Dr.', 'Op. Dr.'];


    /* ================= FETCH DATA ================= */

    // --- KULLANICI LİSTESİNİ ÇEKME FONKSİYONU ---
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await getAllUsers();
            setAllUsers(response.data);
            setError(null);
        } catch (err) {
            setError('Kullanıcı listesi çekilemedi: ' + (err.response?.data || 'Sunucu hatası.'));
            setAllUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // --- POLİKLİNİKLERİ ÇEKME FONKSİYONU ---
    const fetchSpecializations = async () => {
        try {
            const response = await getSpecializations();
            setSpecializations(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Poliklinik çekme hatası:", error);
        }
    };

    // --- RAPORLARI ÇEKME FONKSİYONU ---
    const fetchReports = async () => {
        try {
            const response = await getGeneralReports();
            setReports(response.data);
        } catch (error) {
            console.error("Rapor çekme hatası:", error);
        }
    };


    // --- useEffect: Veri Çekme ---
    useEffect(() => {
        fetchUsers();
        fetchSpecializations();
    }, []);

    useEffect(() => {
        if (activeSection === "reports") {
            fetchReports();
        }
    }, [activeSection]);


    /* ================= DATA FILTERING ================= */

    // --- Kullanıcıları Role Göre Filtreleme ve Adlandırma ---
    const doctorsList = allUsers.filter(u => u.role === 'doctor').filter(d =>
        (d.first_name || d.email).toLowerCase().includes(doctorSearch.toLowerCase())
    );
    const patientsList = allUsers.filter(u => u.role === 'patient').filter(p =>
        (p.first_name || p.email).toLowerCase().includes(patientSearch.toLowerCase())
    );


    /* ================= ACTIONS ================= */

    // --- SİLME İŞLEMİ (Rol kontrollü) ---
    const handleDelete = async (userId, role) => {
        const userRole = role || allUsers.find(u => u.id === userId)?.role || 'kullanıcı';

        if (!window.confirm(`${userRole} rolündeki ${userId} ID'li kullanıcıyı silmek istediğinizden emin misiniz?`)) return;

        try {
            await deleteUser(userId);
            setAllUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            setError('Silme işlemi başarısız oldu: ' + (err.response?.data || 'Sunucu hatası.'));
        }
    };

    // --- KULLANICI EKLEME İŞLEMLERİ ---
    function handleRegisterFormChange(e) {
        setRegisterForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegisterMessage(null);

        if (!registerForm.email || !registerForm.password || !registerForm.first_name || !registerForm.last_name) {
            setRegisterMessage({ type: 'error', text: 'Lütfen zorunlu alanları doldurun.' });
            return;
        }

        try {
            await register(registerForm);
            setRegisterMessage({ type: "success", text: `Yeni ${registerForm.role} başarıyla eklendi.` });

            await fetchUsers();
            setRegisterForm({ email: '', password: '', role: 'doctor', first_name: '', last_name: '', specialization: '', title: 'Dr.' });

        } catch (error) {
            setRegisterMessage({ type: 'error', text: 'Kayıt başarısız oldu: ' + (error.response?.data || 'Sunucu hatası.') });
        }
    };

    // --- DÜZENLEME İŞLEMLERİ ---
    const handleEditClick = (doctor) => {
        setEditingDoctor({ ...doctor }); // Düzenlenecek doktoru state'e yükle
        setShowEditModal(true);
        setEditMessage(null);
    };

    const handleEditChange = (e) => {
        setEditingDoctor((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditMessage(null);

        if (!editingDoctor.email || !editingDoctor.first_name || !editingDoctor.last_name || !editingDoctor.specialization) {
            setEditMessage({ type: 'error', text: 'Lütfen zorunlu alanları doldurun.' });
            return;
        }

        try {
            // Backend API çağrısı
            await updateDoctor(editingDoctor.id, editingDoctor);

            setEditMessage({ type: "success", text: "Doktor bilgileri başarıyla güncellendi." });

            // Frontend listesini güncelle
            await fetchUsers();

            // Modal'ı kapat (Kısa bir süre sonra kapatabiliriz)
            setTimeout(() => {
                setShowEditModal(false);
                setEditingDoctor(null);
            }, 1500);

        } catch (error) {
            setEditMessage({ type: 'error', text: 'Güncelleme başarısız oldu: ' + (error.response?.data || 'Sunucu hatası.') });
        }
    };


    /* ================= RENDER SECTIONS ================= */

    function renderOverview() {
        const totalUsers = allUsers.length;

        return (
            <div>
                <h1 className="admin-title">Genel Bakış</h1>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Toplam Kullanıcı</div>
                        <div className="stat-value">{totalUsers}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Aktif Doktor</div>
                        <div className="stat-value">{doctorsList.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Aktif Hasta</div>
                        <div className="stat-value">{patientsList.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Aktif Poliklinik</div>
                        <div className="stat-value">{specializations.length || 'Yükleniyor'}</div>
                    </div>
                </div>
            </div>
        );
    }

    // --- SADECE DOKTOR LİSTESİ (Ünvan Kolonu Eklendi) ---
    function renderDoctorsList() {
        if (loading) return <div className="card">Doktorlar yükleniyor...</div>;

        return (
            <div>
                <h1 className="admin-title">Doktor Yönetimi</h1>
                {error && <p style={{ color: 'red' }}>{error}</p>}

                <div className="card">
                    <div className="admin-subcard-header">
                        <h3>Mevcut Doktorlar ({doctorsList.length})</h3>
                        <button className="primary-button" onClick={() => { setActiveSection('add'); setRegisterForm({...registerForm, role: 'doctor'}); }}>
                            Yeni Doktor Ekle
                        </button>
                    </div>

                    <div className="search-row">
                        <input
                            className="form-input"
                            placeholder="Doktor ara..."
                            value={doctorSearch}
                            onChange={(e) => setDoctorSearch(e.target.value)}
                        />
                    </div>

                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Ad Soyad</th>
                                <th>E-posta</th>
                                <th>Ünvan</th> {/* YENİ KOLON BAŞLIĞI */}
                                <th>Branş</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctorsList.map((d) => (
                                <tr key={d.id}>
                                    <td>{d.id}</td>
                                    <td>
                                        {d.first_name} {d.last_name}
                                    </td>
                                    <td>{d.email}</td>
                                    <td>{d.title || 'Dr.'}</td> {/* ÜNVAN VERİSİ */}
                                    <td>{d.specialization || 'N/A'}</td>
                                    <td>
                                        <button
                                            className="chip-button chip-info"
                                            onClick={() => handleEditClick(d)}
                                            style={{ marginRight: '8px' }}
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            className="chip-button chip-danger"
                                            onClick={() => handleDelete(d.id, 'Doktor')}
                                        >
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // --- SADECE HASTA LİSTESİ ---
    function renderPatientsList() {
        if (loading) return <div className="card">Hastalar yükleniyor...</div>;

        return (
            <div>
                <h1 className="admin-title">Hasta Yönetimi</h1>
                {error && <p style={{ color: 'red' }}>{error}</p>}

                <div className="card">
                    <div className="admin-subcard-header">
                        <h3>Mevcut Hastalar ({patientsList.length})</h3>
                        <button className="primary-button" onClick={() => { setActiveSection('add'); setRegisterForm({...registerForm, role: 'patient'}); }}>
                            Yeni Hasta Ekle
                        </button>
                    </div>

                    <div className="search-row">
                        <input
                            className="form-input"
                            placeholder="Hasta ara (Ad veya E-posta)..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                        />
                    </div>

                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>E-posta</th>
                                <th>Ad Soyad</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patientsList.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td>{p.email}</td>
                                    <td>{p.first_name} {p.last_name}</td>
                                    <td>
                                        <button
                                            className="chip-button chip-danger"
                                            onClick={() => handleDelete(p.id, 'Hasta')}
                                        >
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // --- YENİ KULLANICI EKLEME BÖLÜMÜ ---
    function renderAddUser() {

        return (
            <div className="card">
                <h2>Yeni Kullanıcı Kaydet ({registerForm.role === 'doctor' ? 'Doktor' : registerForm.role === 'patient' ? 'Hasta' : 'Admin'})</h2>
                {registerMessage && (
                    <p style={{ color: registerMessage.type === 'error' ? 'red' : 'green', fontWeight: 'bold' }}>
                        {registerMessage.text}
                    </p>
                )}
                <form onSubmit={handleRegisterSubmit} className="appointment-form">
                    <div className="form-field">
                        <label>E-posta (Kullanıcı Adı)</label>
                        <input type="email" name="email" value={registerForm.email} onChange={handleRegisterFormChange} className="form-input" required />
                    </div>
                    <div className="form-field">
                        <label>Şifre</label>
                        <input type="password" name="password" value={registerForm.password} onChange={handleRegisterFormChange} className="form-input" required />
                    </div>
                    <div className="form-row">
                        <div className="form-field">
                            <label>Ad</label>
                            <input type="text" name="first_name" value={registerForm.first_name} onChange={handleRegisterFormChange} className="form-input" required />
                        </div>
                        <div className="form-field">
                            <label>Soyad</label>
                            <input type="text" name="last_name" value={registerForm.last_name} onChange={handleRegisterFormChange} className="form-input" required />
                        </div>
                    </div>
                    <div className="form-field">
                        <label>Rol</label>
                        <select name="role" value={registerForm.role} onChange={handleRegisterFormChange} className="form-input">
                            <option value="doctor">Doktor</option>
                            <option value="patient">Hasta</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {registerForm.role === 'doctor' && (
                        <>
                            <div className="form-field">
                                <label>Ünvan</label>
                                <select name="title" value={registerForm.title} onChange={handleRegisterFormChange} className="form-input" required>
                                    {titleOptions.map(title => (
                                        <option key={title} value={title}>{title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Uzmanlık Alanı</label>
                                <input type="text" name="specialization" value={registerForm.specialization} onChange={handleRegisterFormChange} className="form-input" required />
                            </div>
                        </>
                    )}
                    <button type="submit" className="appointment-submit" style={{ marginTop: '15px' }}>
                        Kullanıcıyı Kaydet
                    </button>
                </form>
            </div>
        );
    }

    // --- DÜZENLEME MODALI ---
    function renderEditDoctorModal() {
        if (!showEditModal || !editingDoctor) return null;

        return (
            <div className="modal-backdrop">
                <div className="modal">
                    <h2>Doktor Düzenle: {editingDoctor.title} {editingDoctor.first_name} {editingDoctor.last_name}</h2>

                    {editMessage && (
                        <p style={{ color: editMessage.type === 'error' ? 'red' : 'green', fontWeight: 'bold', marginBottom: '15px' }}>
                            {editMessage.text}
                        </p>
                    )}

                    <form onSubmit={handleEditSubmit} className="appointment-form">

                        <div className="form-field">
                            <label>E-posta</label>
                            <input type="email" name="email" value={editingDoctor.email} onChange={handleEditChange} className="form-input" required />
                        </div>

                        <div className="form-row">
                            <div className="form-field">
                                <label>Ad</label>
                                <input type="text" name="first_name" value={editingDoctor.first_name} onChange={handleEditChange} className="form-input" required />
                            </div>
                            <div className="form-field">
                                <label>Soyad</label>
                                <input type="text" name="last_name" value={editingDoctor.last_name} onChange={handleEditChange} className="form-input" required />
                            </div>
                        </div>

                        <div className="form-field">
                            <label>Ünvan</label>
                            <select name="title" value={editingDoctor.title} onChange={handleEditChange} className="form-input" required>
                                {titleOptions.map(title => (
                                    <option key={title} value={title}>{title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Uzmanlık Alanı</label>
                            <input type="text" name="specialization" value={editingDoctor.specialization} onChange={handleEditChange} className="form-input" required />
                        </div>

                        <div className="modal-actions">
                             <button type="submit" className="modal-button modal-save" style={{ marginRight: '10px' }}>
                                Kaydet
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="modal-button modal-cancel">
                                İptal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }


    // --- POLİKLİNİKLER RENDER ---
    function renderClinics() {

         return (
            <>
                <h1 className="admin-title">Poliklinik Yönetimi</h1>

                <div className="card">
                    <h2>Mevcut Poliklinikler ({specializations.length})</h2>
                    {loading ? (
                        <p>Poliklinikler yükleniyor...</p>
                    ) : specializations.length > 0 ? (
                        <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginTop: '10px' }}>
                            {specializations.map((spec, index) => (
                                <li key={index} style={{ marginBottom: '5px' }}>
                                    {spec}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Sistemde kayıtlı poliklinik bulunmamaktadır. Lütfen bir doktor ekleyiniz.</p>
                    )}
                </div>
            </>
        );
    }

    // --- RAPORLAR RENDER ---
    function renderReports() {

         return (
            <>
                <h1 className="admin-title">Raporlar ve İstatistikler</h1>
                {error && <p style={{ color: 'red' }}>{error}</p>}

                <div className="card">
                    <h2>Sistem İstatistikleri</h2>
                    {loading ? (
                        <p>Raporlar yükleniyor...</p>
                    ) : reports ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '15px' }}>

                            <div className="stat-card stat-red">
                                <h3 style={{ margin: 0 }}>Toplam Hasta</h3>
                                <div className="stat-value">{reports.patients}</div>
                            </div>

                            <div className="stat-card stat-yellow">
                                <h3 style={{ margin: 0 }}>Toplam Doktor</h3>
                                <div className="stat-value">{reports.doctors}</div>
                            </div>

                            <div className="stat-card stat-green">
                                <h3 style={{ margin: 0 }}>Toplam Randevu</h3>
                                <div className="stat-value">{reports.appointments}</div>
                            </div>
                        </div>
                    ) : (
                        <p>Rapor verileri alınamadı.</p>
                    )}
                </div>
            </>
        );
    }

    // ==== RETURN: SIDEBAR DÜZENLEMESİ ====
    return (
        <div className="app-layout">
            {renderEditDoctorModal()} {/* MODALI EN ÜSTE ÇAĞIRIYORUZ */}

            <aside className="app-sidebar">
                <div>
                    <h2 className="app-sidebar-title">Cankaya Hospital</h2>
                    <p className="app-sidebar-subtitle">@{user?.username || "admin"} · yönetici</p>

                    <div className="sidebar-buttons">
                        <button
                            className={"sidebar-button " + (activeSection === "overview" ? "sidebar-button-active" : "")}
                            onClick={() => setActiveSection("overview")}>
                            Genel Bakış
                        </button>

                        <button
                            className={"sidebar-button " + (activeSection === "doctors" ? "sidebar-button-active" : "")}
                            onClick={() => setActiveSection("doctors")}>
                            Doktorlar
                        </button>

                        <button
                            className={"sidebar-button " + (activeSection === "patients" ? "sidebar-button-active" : "")}
                            onClick={() => setActiveSection("patients")}>
                            Hastalar
                        </button>

                        <button
                            className={"sidebar-button " + (activeSection === "clinics" ? "sidebar-button-active" : "")}
                            onClick={() => setActiveSection("clinics")}>
                            Poliklinikler
                        </button>

                        <button
                            className={"sidebar-button " + (activeSection === "reports" ? "sidebar-button-active" : "")}
                            onClick={() => setActiveSection("reports")}>
                            Raporlar
                        </button>
                    </div>
                </div>

                <button className="logout-button" onClick={onLogout}>
                    Çıkış
                </button>
            </aside>

            <main className="app-main">
                {activeSection === "overview" && renderOverview()}
                {activeSection === "doctors" && renderDoctorsList()}
                {activeSection === "patients" && renderPatientsList()}
                {activeSection === "add" && renderAddUser()}
                {activeSection === "clinics" && renderClinics()}
                {activeSection === "reports" && renderReports()}
            </main>
        </div>
    );
}