// src/pages/AdminPage.jsx (NİHAİ VE TAM HALİ - Modal Detay ve Sarı Buton)

import { useState, useEffect, useMemo } from "react";
import "../styles/layout.css";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
      getAppointmentsBySpecialization,
      getAllUsers,
      deleteUser,
      register,
      updateDoctor,
      getSpecializations,
      getGeneralReports,
      getAppointmentStats,
      initializeAuthToken,
      getDoctorsBySpecialization

} from "../services/api";

export default function AdminPage({ user, onLogout }) {
    const [activeSection, setActiveSection] = useState("overview");
const [statsData, setStatsData] = useState([]); // Grafik verileri
const [period, setPeriod] = useState('month');  // 'day', 'week', 'month'
    // --- USERS & LOADING STATE'LERİ ---
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
const [specializationData, setSpecializationData] = useState([]);
const [doctorData, setDoctorData] = useState([]);
const [selectedSpec, setSelectedSpec] = useState(null);

    // --- CANLI VERİ STATE'LERİ ---
    const [specializations, setSpecializations] = useState([]);
    const [reports, setReports] = useState(null);

    // POLİKLİNİK DETAY MODALI STATE'LERİ
    const [showClinicDetailModal, setShowClinicDetailModal] = useState(false);
    const [selectedClinicDetail, setSelectedClinicDetail] = useState(null); // Modalda gösterilecek klinik objesi


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


    /* ================= DATA ANALYSIS ================= */

    // Poliklinik ve doktor verilerini hazırlayan useMemo
    const clinicData = useMemo(() => {
        // 1. Doktor sayısını sayan bir map oluştur
        const doctorCountMap = allUsers
            .filter(u => u.role === 'doctor')
            .reduce((acc, doctor) => {
                const spec = doctor.specialization;
                if (spec) {
                    acc[spec] = (acc[spec] || 0) + 1;
                }
                return acc;
            }, {});

        // 2. Poliklinik adlarını ve doktor sayılarını birleştir
        return specializations.map(specName => ({
            name: specName, // Poliklinik adı
            doctorCount: doctorCountMap[specName] || 0,
            doctors: allUsers.filter(u => u.role === 'doctor' && u.specialization === specName)
        }));
    }, [specializations, allUsers]);


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
// handleSpecializationClick fonksiyonu
const handleSpecializationClick = (data) => {
    const spec = data?.department;

    if (!spec) return;

    setSelectedSpec(spec);

    getDoctorsBySpecialization(spec)
        .then(res => {
            setDoctorData(res.data || []);
        })
        .catch(err => {
            console.error("Doktor verisi çekilemedi:", err);
            setDoctorData([]);
        });
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

  const fetchReports = async () => {
      try {
          setLoading(true);
          initializeAuthToken();

          // Backend'e seçilen periyodu (day/week/month) gönderiyoruz
          const [reportsRes, statsRes] = await Promise.all([
              getGeneralReports(),
              getAppointmentStats(period) // 'period' state'i buradan API'ye gider
          ]);

          const sortedData = (statsRes.data || []).sort((a, b) => b.count - a.count);

          setReports(reportsRes.data);
          setStatsData(sortedData);
      } catch (error) {
          console.error("Rapor hatası:", error);
          setStatsData([]);
      } finally {
          setLoading(false);
      }
  };


    // --- useEffect: Veri Çekme ---
    useEffect(() => {
        fetchUsers();
        fetchSpecializations();
    }, []);

    useEffect(() => {
        if (activeSection === "reports") {
            fetchReports(); //
        }
        setShowClinicDetailModal(false);
    }, [activeSection, period]); //



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


    // --- POLİKLİNİK DETAY MODALI ---
    function renderClinicDetailModal() {
        if (!showClinicDetailModal || !selectedClinicDetail) return null;

        const clinic = selectedClinicDetail;

        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ width: '450px' }}>
                    <h2>{clinic.name} Doktorları</h2>
                    <p style={{ color: '#007bff', fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                        Toplam {clinic.doctorCount} Aktif Doktor
                    </p>

                    <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
                        {clinic.doctors.length > 0 ? (
                            clinic.doctors.map((doctor) => (
                                <li key={doctor.id} style={{ marginBottom: '10px', padding: '5px 0' }}>
                                    <span style={{ fontWeight: 'bold' }}>
                                        {doctor.title || 'Dr.'} {doctor.first_name} {doctor.last_name}
                                    </span>
                                    <br />
                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                        {doctor.email}
                                    </span>
                                </li>
                            ))
                        ) : (
                            <p>Bu poliklinikte kayıtlı doktor bulunmamaktadır.</p>
                        )}
                    </ul>

                    <div className="modal-actions" style={{ marginTop: '20px' }}>
                        <button
                            type="button"
                            onClick={() => setShowClinicDetailModal(false)}
                            className="modal-button modal-cancel">
                            Kapat
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    // --- POLİKLİNİKLER RENDER ---
    function renderClinics() {

        // Detay görme işlemini modale yönlendir
        const handleDetailClick = (clinic) => {
            setSelectedClinicDetail(clinic);
            setShowClinicDetailModal(true);
        };

        return (
            <>
                <h1 className="admin-title">Poliklinik Yönetimi</h1>

                <div className="card">
                    <h2>Mevcut Poliklinikler ({clinicData.length})</h2>

                    {loading ? (
                        <p>Poliklinikler yükleniyor...</p>
                    ) : clinicData.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {clinicData.map((clinic) => (
                                <li
                                    key={clinic.name}
                                    style={{
                                        padding: '10px',
                                        borderBottom: '1px solid #eee',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'default',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    {/* 1. Poliklinik Adı ve Doktor Sayısı (SARI YAPILDI) */}
                                    <span style={{ fontWeight: 'bold' }}>
                                        {clinic.name}
                                        <span style={{ marginLeft: '10px', color: '#ffc107', fontWeight: 'bold' }}>
                                            ({clinic.doctorCount} Doktor)
                                        </span>
                                    </span>

                                    {/* 2. Detay Göster Butonu (SARI YAPILDI) */}
                                    <button
                                        style={{
                                            padding: '5px 10px',
                                            border: '1px solid #ffc107',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            backgroundColor: '#ffc107', // Sarı arka plan
                                            color: '#2b2b2b', // Koyu yazı
                                            fontWeight: 'bold',
                                            opacity: clinic.doctorCount === 0 ? 0.6 : 1, // Doktor yoksa soluklaştır
                                        }}
                                        onClick={() => handleDetailClick(clinic)}
                                        disabled={clinic.doctorCount === 0}
                                    >
                                        Detay Gör
                                    </button>
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



    // src/pages/AdminPage.jsx içindeki renderReports ve return kısmının EN GÜNCEL HALİ:

        function renderReports() {
            return (
                <>
                    <h1 className="admin-title">Raporlar ve İstatistikler</h1>

                    {/* 1. GRAFİK: SARI (Bölüm Bazlı Analiz) */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2>Bölüm Bazlı Randevu Analizi</h2>
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="form-input"
                                style={{ width: '150px' }}
                            >
                                <option value="day">Günlük</option>
                                <option value="week">Haftalık</option>
                                <option value="month">Aylık</option>
                            </select>
                        </div>

                        <div style={{ width: '100%', height: '350px' }}>
                            {statsData && statsData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={statsData}
                                        onClick={(e) => {
                                            if (e && e.activeLabel) {
                                                handleSpecializationClick({ department: e.activeLabel });
                                            }
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="department" stroke="#333" fontSize={12} />
                                        <YAxis stroke="#333" fontSize={12} />
                                        <Tooltip contentStyle={{ backgroundColor: '#2b2b2b', color: '#fff', borderRadius: '8px' }} />
                                        <Bar
                                            dataKey="count"
                                            name="Randevu Sayısı"
                                            fill="#ffc107"
                                            cursor="pointer"
                                            radius={[4, 4, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>

                                </ResponsiveContainer>
                            ) : (
                                <p style={{ textAlign: 'center', padding: '20px' }}>{loading ? "Yükleniyor..." : "Veri bulunamadı."}</p>
                            )}
                        </div>
                    </div>

                    {/* 2. GRAFİK: YEŞİL (Doktor Bazlı Detay) */}
                    {selectedSpec && (
                        <div className="card" style={{ marginTop: "20px", borderLeft: "5px solid #52c41a" }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3>{selectedSpec} - Doktor Dağılımı</h3>
                                <button
                                    className="chip-button"
                                    onClick={() => setSelectedSpec(null)}
                                    style={{ fontSize: '12px' }}
                                >
                                    Kapat
                                </button>
                            </div>

                            <div style={{ width: '100%', height: '300px' }}>
                                {doctorData && doctorData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={doctorData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="doctor" stroke="#333" fontSize={11} />
                                            <YAxis stroke="#333" />
                                            <Tooltip />
                                            <Bar
                                                dataKey="count"
                                                name="Randevu Sayısı"
                                                fill="#52c41a" // YEŞİL RENK
                                                radius={[4, 4, 0, 0]}
                                                barSize={35}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p style={{ textAlign: 'center', padding: '20px' }}>Bu branşta randevu kaydı yok.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SİSTEM ÖZET KARTLARI */}
                    <div className="card" style={{ marginTop: '20px' }}>
                        <h2>Sistem Özet İstatistikleri</h2>
                        {reports ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '15px' }}>
                                <div className="stat-card" style={{ borderLeft: '5px solid #ff4d4f' }}>
                                    <small>Toplam Hasta</small>
                                    <div className="stat-value">{reports.patients}</div>
                                </div>
                                <div className="stat-card" style={{ borderLeft: '5px solid #ffc107' }}>
                                    <small>Toplam Doktor</small>
                                    <div className="stat-value">{reports.doctors}</div>
                                </div>
                                <div className="stat-card" style={{ borderLeft: '5px solid #52c41a' }}>
                                    <small>Toplam Randevu</small>
                                    <div className="stat-value">{reports.appointments}</div>
                                </div>
                            </div>
                        ) : <p>Özet veriler yüklenemedi.</p>}
                    </div>
                </>
            );
        }

        // ANA RETURN BLOĞU
        return (
            <div className="app-layout">
                {/* MODALLAR */}
                {renderEditDoctorModal()}
                {renderClinicDetailModal()}

                {/* SOL MENÜ (Sidebar) */}
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

                {/* SAĞ İÇERİK (Main Content) */}
                <main className="app-main">
                    {activeSection === "overview" && renderOverview()}
                    {activeSection === "doctors" && renderDoctorsList()}
                    {activeSection === "patients" && renderPatientsList()}
                    {activeSection === "clinics" && renderClinics()}
                    {activeSection === "reports" && renderReports()}
                    {activeSection === "add" && renderAddUser()}
                </main>
            </div>
        );    }