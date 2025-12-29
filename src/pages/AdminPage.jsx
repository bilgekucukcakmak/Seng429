// src/pages/AdminPage.jsx (NİHAİ VE TAM HALİ - Modal Detay ve Sarı Buton)
import axios from 'axios';
import { useState, useEffect, useMemo } from "react";
import "../styles/layout.css";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api, {
      getAppointmentsBySpecialization,
      getAllUsers,
      deleteUser,
      register,
      updateDoctor,
      getSpecializations,
      getGeneralReports,
      getAppointmentStats,
      initializeAuthToken,
      getDoctorsBySpecialization,
      getDoctorPerformance

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
const [selectedLog, setSelectedLog] = useState(null); // Tıklanan logu tutacak
const [performanceData, setPerformanceData] = useState([]);
const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null);
// AdminPage.jsx içinde yeni bir state ve useEffect ekle
const [leaveRequests, setLeaveRequests] = useState([]);
const [leaveTab, setLeaveTab] = useState("pending"); // "pending", "approved", "rejected"
const filteredRequests = leaveRequests.filter(req =>
    req.status.toString().toLowerCase() === leaveTab.toLowerCase()
);

const fetchLeaveRequests = async () => {
    try {
        const res = await api.get('/admin/leave-requests');
        setLeaveRequests(res.data);
    } catch (err) {
        console.error("İzin verileri çekilemedi:", err);
        // Hatanın nedenini alert ile ekrana bas ki ne olduğunu anlayalım
        alert("Sunucu Hatası (500): " + (err.response?.data?.error || "Backend kodunu kontrol edin."));
    }
};

const handleApproveLeave = async (requestId, doctorId, startDate) => {
    try {
        await api.post('/admin/approve-leave', {
            requestId, // Talebin kendi ID'si
            doctorId,  // Doktorun ID'si
            startDate  // İzin günü
        });
        alert("İzin başarıyla onaylandı!");
        fetchLeaveRequests(); // İzin listesini yeniler (Böylece onaylananlara geçer)
        fetchUsers();         // Doktor detayındaki rozeti güncellemek için
    } catch (err) {
        alert("Hata oluştu.");
    }
};

const handleRejectLeave = async (requestId) => {
    if (!window.confirm("Bu izin talebini reddetmek istediğinize emin misiniz?")) return;
    try {
        // 'api' servisini kullanmak daha güvenlidir
        await api.post('/admin/reject-leave', { requestId });
        alert("İzin talebi reddedildi.");
        fetchLeaveRequests(); // Listeyi yeniler
    } catch (err) {
        console.error("Reddetme hatası:", err);
        alert(err.response?.data?.message || "Reddetme işlemi sırasında bir hata oluştu.");
    }
};
    // --- CANLI VERİ STATE'LERİ ---
    const [specializations, setSpecializations] = useState([]);
    const [reports, setReports] = useState(null);

    // POLİKLİNİK DETAY MODALI STATE'LERİ
    const [showClinicDetailModal, setShowClinicDetailModal] = useState(false);
    const [selectedClinicDetail, setSelectedClinicDetail] = useState(null); // Modalda gösterilecek klinik objesi


    // YENİ KULLANICI EKLEME İÇİN TEK BİR FORM KULLANIYORUZ
    const [registerForm, setRegisterForm] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'doctor',
         specializationId: '',
        title: 'Dr.'
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

useEffect(() => {
    if (activeSection === "performance") {
        getDoctorPerformance()
            .then(res => {
                console.log("📊 Performans verisi:", res.data);
                setPerformanceData(res.data);
            })
            .catch(err => {
                console.error("Performans verisi alınamadı:", err);
                setPerformanceData([]);
            });
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

  function handleRegisterFormChange(e) {
      const { name, value } = e.target;
      setRegisterForm((prev) => ({
          ...prev,
          [name]: value // Burada name="specialization" olduğu için state'e öyle kaydolur
      }));
  }

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegisterMessage(null);

        if (!registerForm.email || !registerForm.password || !registerForm.first_name || !registerForm.last_name) {
            setRegisterMessage({ type: 'error', text: 'Lütfen zorunlu alanları doldurun.' });
            return;
        }

        try {
            await register(registerForm); // Mevcut gönderme şeklin doğru
            setRegisterMessage({ type: "success", text: `Yeni ${registerForm.role} başarıyla eklendi.` });

            await fetchUsers();
            setRegisterForm({
                email: '',
                password: '',
                role: 'doctor',
                first_name: '',
                last_name: '',
                specialization: '',
                title: 'Dr.',
                academic_background: '' // Bunu ekledik
            });
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
// State ekle
const [logs, setLogs] = useState([]);

// Veri çekme fonksiyonunu bu şekilde güncelleyin
const fetchLogs = async () => {
    try {
         const res = await api.get('/admin/logs');
        setLogs(res.data);
    } catch (err) {
        console.error("Loglar yüklenemedi:", err);
        setLogs([]);
    }
};


function renderLeaveRequests() {
    return (
        <div className="card">
            <h2>⏳ Bekleyen İzin Talepleri</h2>
            {leaveRequests.length === 0 ? <p>Bekleyen talep yok.</p> : (
                <table className="doctor-table">
                    <thead>
                        <tr>
                            <th>Doktor</th>
                            <th>İzin Tarihi</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaveRequests.map(req => (
                            <tr key={req.id}>
                                <td>{req.title} {req.first_name} {req.last_name}</td>
                                <td>{new Date(req.start_date).toLocaleDateString('tr-TR')}</td>
                                <td>
                                    <button
                                        className="primary-button"
                                        style={{ backgroundColor: '#2ecc71', marginRight: '5px' }}
                                        onClick={() => handleApproveLeave(req)}
                                    >
                                        Onayla
                                    </button>
                                    <button className="primary-button" style={{ backgroundColor: '#e74c3c' }}>Reddet</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}


// renderLogs Fonksiyonu
function renderLogs() {
    return (
        <div className="card">
            <h1 className="admin-title">Sistem Hareket İzleme</h1>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Tarih</th>
                        <th>İşlem</th>
                        <th>Kullanıcı ID</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => {
                        let parsedDetail = {};
                        try { parsedDetail = JSON.parse(log.details); } catch(e) { parsedDetail = {id: log.details}; }

                        return (
                            <tr key={log.id}
                                onClick={() => setSelectedLog(parsedDetail)}
                                style={{cursor: 'pointer'}}
                                className="hover-row">
                                <td>{new Date(log.created_at).toLocaleString('tr-TR')}</td>
                                <td><span className="chip-button chip-info">{log.action}</span></td>
                                <td>{parsedDetail.id || "Bilinmiyor"}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>


            {selectedLog && (
                <div className="modal-backdrop">
                    <div className="modal" style={{ borderLeft: '5px solid #ffc107', padding: '20px' }}>
                        <h2>İşlem Detayı</h2>
                        <div style={{ marginTop: '15px', lineHeight: '2' }}>
                            {/* ID sadece numara olarak görünmeli */}
                            <p><strong>Silinen ID:</strong> {selectedLog.id}</p>

                            {/* Rol kontrolü: Backend 'doctor' veya 'patient' göndermeli */}
                            <p><strong>Rol:</strong> {selectedLog.role === 'doctor' ? '👨‍⚕️ Doktor' : '👤 Hasta'}</p>

                            {/* İsim alanı: Backend 'fullName' göndermeli */}
                            <p><strong>Ad Soyad:</strong> {selectedLog.fullName || 'Bilgi Mevcut Değil'}</p>

                            {selectedLog.role === 'doctor' && (
                                <>
                                    <p><strong>Ünvan:</strong> {selectedLog.title || 'N/A'}</p>
                                    <p><strong>Branş:</strong> {selectedLog.specialization || 'N/A'}</p>
                                </>
                            )}
                        </div>
                        <button className="modal-button modal-cancel" onClick={() => setSelectedLog(null)} style={{ marginTop: '20px' }}>
                            Kapat
                        </button>
                    </div>
                </div>
            )}
                </div>
            );
        }


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
                <div className="admin-subcard-header" style={{ marginBottom: '20px' }}>
                    <h1 className="admin-title" style={{ margin: 0 }}>Doktor Yönetimi</h1>
                    <button className="primary-button" onClick={() => { setActiveSection('add'); setRegisterForm({...registerForm, role: 'doctor'}); }}>
                        Yeni Doktor Ekle
                    </button>
                </div>

                <div className="search-row" style={{ marginBottom: '30px' }}>
                    <input
                        className="form-input"
                        placeholder="Doktor veya branş ara..."
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                        style={{ width: '100%', maxWidth: '400px' }}
                    />
                </div>

                <div className="doctor-grid">
                    {doctorsList.map((d) => (
                        <div key={d.id} className="doctor-postit-card">
                            <div className="doctor-accent"></div>

                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#95a5a6', fontWeight: 'bold' }}>ID: #{d.id}</div>
                                <h3 style={{ margin: '5px 0', color: '#2c3e50', fontSize: '1.2rem' }}>
                                    {d.title || 'Dr.'} {d.first_name} {d.last_name}
                                </h3>
                                <span style={{
                                    fontSize: '0.8rem',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    backgroundColor: '#fdf6e3',
                                    color: '#b58900',
                                    fontWeight: '600'
                                }}>
                                    🩺 {d.specialization || 'Genel'}
                                </span>
                            </div>

                            <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '20px' }}>
                                <div style={{ marginBottom: '5px' }}>📧 {d.email}</div>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                borderTop: '1px solid #f1f1f1',
                                paddingTop: '15px'
                            }}>
                        <button
                            className="chip-button"
                            style={{ flex: 1, backgroundColor: '#eee' }}
                            onClick={() => {
                                console.log("🔍 SEÇİLEN DOKTOR OBJESİ:", d);
                                console.log("🎓 AKADEMİK VERİ VAR MI?:", d.academic_background);
                                setSelectedDoctorDetails(d);
                            }}
                        >
                            🔍Detay
                        </button>
                                <button
                                    className="chip-button chip-info"
                                    onClick={() => handleEditClick(d)}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    Düzenle
                                </button>
                                <button
                                    className="chip-button chip-danger"
                                    onClick={() => handleDelete(d.id, 'Doktor')}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    Sil
                                </button>
                            </div>
                        </div>
                    ))}
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
                                        <label>Uzmanlık Alanı (Poliklinik)</label>
                                        <input
                                            type="text"
                                            name="specialization"
                                            value={registerForm.specialization || ''}
                                            onChange={handleRegisterFormChange}
                                            className="form-input"
                                            placeholder="Örn: Kardiyoloji"
                                            required
                                        />
                                    </div>


                            <div className="form-field">
                                <label>Akademik Geçmiş</label>
                                <textarea
                                    name="academic_background"
                                    className="form-input"
                                    placeholder="Eğitim bilgilerini alt alta yazınız..."
                                    /* value ve onChange aynı alan ismini (academic_background) kullanmalı */
                                    value={registerForm.academic_background || ''}
                                    onChange={(e) => {
                                        setRegisterForm(prev => ({
                                            ...prev,
                                            academic_background: e.target.value
                                        }));
                                    }}
                                />
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
                           <label>Uzmanlık Alanı (Poliklinik)</label>
                           <input
                               type="text"
                               name="specialization"
                               value={registerForm.specialization || ''} // registerForm state'ine bağlı olmalı
                               onChange={handleRegisterFormChange} // Yeni kayıt fonksiyonunu kullanmalı
                               className="form-input"
                               placeholder="Örn: Kardiyoloji"
                               required
                           />
                       </div>

                        <div className="form-field">
                            <label>Akademik Geçmiş (Her satıra bir eğitim bilgisi giriniz)</label>
                            <textarea
                                // 1. Backend'in beklediği isim
                                name="academic_background"
                                className="form-input"
                                style={{ minHeight: '100px', resize: 'vertical' }}
                                placeholder="Örn: Hacettepe Üniversitesi Tıp Fakültesi - 2010"
                                // 2. Senin çalışan mantığın (academic_background üzerinden)
                                value={Array.isArray(editingDoctor.academic_background)
                                       ? editingDoctor.academic_background.join('\n')
                                       : (editingDoctor.academic_background || '')}
                                // 3. Yazmanı sağlayan onChange mantığı
                                onChange={(e) => {
                                    const lines = e.target.value.split('\n');
                                    setEditingDoctor(prev => ({
                                        ...prev,
                                        academic_background: lines // State'e dizi olarak atıyoruz
                                    }));
                                }}
                            />
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

// State ekle


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
function renderPerformance() {
    return (
        <div className="card">
            <h1 className="admin-title">Doktor Performansları</h1>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Doktor</th>
                        <th>Branş</th>
                        <th>Tamamlanan %</th>
                        <th>İptal %</th>
                        <th>Yorum</th>
                    </tr>
                </thead>
                <tbody>
                    {performanceData.length > 0 ? (
                        performanceData.map(d => (
                            <tr key={d.id}>
                                <td>{d.doctor}</td>
                                <td>{d.specialization}</td>
                                <td>%{d.completionRate}</td>
                                <td>%{d.score}</td>
                                <td>
                                    {d.status === "risk" && "🔴 Riskli"}
                                    {d.status === "normal" && "🟡 Normal"}
                                    {d.status === "high" && "🟢 Yüksek"}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" style={{ textAlign: "center" }}>
                                Performans verisi bulunamadı
                            </td>
                        </tr>
                    )}
                </tbody>

            </table>
        </div>
    );
}

function renderDoctorDetailsModal() {
    if (!selectedDoctorDetails) return null;
    const d = selectedDoctorDetails;

    // İzin tarihlerini güvenli bir şekilde ayrıştırma
    let leaveDates = [];
    try {
        if (d.leave_dates) {
            leaveDates = typeof d.leave_dates === 'string' ? JSON.parse(d.leave_dates) : d.leave_dates;
        }
    } catch (e) {
        console.error("İzin tarihleri ayrıştırma hatası:", e);
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }} onClick={() => setSelectedDoctorDetails(null)}>

            <div style={{
                background: 'white', padding: '30px', borderRadius: '25px',
                width: '90%', maxWidth: '500px', color: '#2c3e50', position: 'relative',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
            }} onClick={e => e.stopPropagation()}>

                {/* Profil Başlığı */}
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                    <div style={{
                        width: '70px', height: '70px', background: '#ffc107', borderRadius: '50%',
                        margin: '0 auto 15px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white', fontSize: '1.6rem', fontWeight: 'bold'
                    }}>
                        {d.first_name ? d.first_name[0].toUpperCase() : 'D'}
                        {d.last_name ? d.last_name[0].toUpperCase() : ''}
                    </div>
                    {/* Backend'den gelen Ceyhun Karagöz verisini kullanıyoruz */}
                    <h2 style={{ margin: 0, fontSize: '1.7rem' }}>{d.title} {d.first_name} {d.last_name}</h2>
                    <p style={{ color: '#ffc107', fontWeight: 'bold', margin: '5px 0' }}>{d.specialization}</p>
                    <small style={{ color: '#95a5a6' }}>{d.email}</small>
                </div>

                {/* Akademik Geçmiş */}
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '15px', borderLeft: '6px solid #ffc107', marginBottom: '15px' }}>
                    <h4 style={{ marginTop: 0, color: '#2c3e50', fontSize: '0.9rem', marginBottom: '8px' }}>📚 Akademik Geçmiş</h4>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#34495e', whiteSpace: 'pre-wrap' }}>
                        {d.academic_background || "Kayıtlı akademik geçmiş bilgisi bulunamadı."}
                    </div>
                </div>

                {/* Yaklaşan İzinler */}
                <div style={{ padding: '15px', background: '#fff', borderRadius: '15px', border: '1px solid #f1f1f1', marginBottom: '20px' }}>
                    <h4 style={{ marginTop: 0, color: '#2c3e50', fontSize: '0.9rem', marginBottom: '10px' }}>📅 Yaklaşan İzinler</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {leaveDates && leaveDates.length > 0 ? (
                            leaveDates.map((date, index) => (
                                <span key={index} style={{
                                    backgroundColor: '#fff3cd', color: '#856404',
                                    padding: '5px 12px', borderRadius: '15px', fontSize: '0.75rem',
                                    border: '1px solid #ffeeba', fontWeight: '600'
                                }}>
                                    {new Date(date).toLocaleDateString('tr-TR')}
                                </span>
                            ))
                        ) : (
                            <span style={{ color: '#95a5a6', fontSize: '0.8rem', fontStyle: 'italic' }}>Kayıtlı izin bulunmuyor.</span>
                        )}
                    </div>
                </div>

                {/* Butonlar Grubu */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* E-Posta Butonu - Hover Efektli */}
                    <button
                        style={{
                            width: '100%', padding: '12px', borderRadius: '12px',
                            border: '2px solid #ffc107', background: 'white',
                            color: '#ffc107', fontWeight: 'bold', cursor: 'pointer',
                            fontSize: '0.95rem', transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#fff9e6';
                            e.target.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.transform = 'scale(1)';
                        }}
                        onClick={() => window.location.href = `mailto:${d.email}`}
                    >
                        ✉️ Doktora E-Posta Gönder
                    </button>

                    {/* Kapat Butonu - Hover Efektli */}
                    <button
                        onClick={() => setSelectedDoctorDetails(null)}
                        style={{
                            width: '100%', padding: '15px',
                            backgroundColor: '#ffc107', border: 'none', borderRadius: '12px',
                            fontWeight: 'bold', cursor: 'pointer', color: 'white',
                            fontSize: '1rem', transition: 'all 0.3s ease',
                            boxShadow: '0 4px 10px rgba(255, 193, 7, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#e5ac00';
                            e.target.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#ffc107';
                            e.target.style.transform = 'scale(1)';
                        }}
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
}

// AdminPage.jsx içinde yeni bir render fonksiyonu
function renderLeaveManagement() {
    // leaveTab state'ine göre filtreleme (pending, approved, rejected)
    const filteredData = leaveRequests.filter(req => req.status === leaveTab);

    return (
        <div style={{ padding: '20px' }}>
            {/* Üst Başlık */}
            <div style={{ marginBottom: '30px', borderBottom: '2px solid #f1f1f1', paddingBottom: '20px' }}>
                <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '15px' }}>⚖️</span>
                    İzin Yönetim Paneli
                </h1>
            </div>

            {/* Profesyonel Navigasyon Sekmeleri */}
            <div style={{
                display: 'flex', gap: '10px', marginBottom: '30px',
                background: '#f8f9fa', padding: '10px', borderRadius: '18px', width: 'fit-content'
            }}>
                {[
                    { id: 'pending', label: '⏳ Bekleyenler', color: '#ffc107' },
                    { id: 'approved', label: '✅ Onaylananlar', color: '#2ecc71' },
                    { id: 'rejected', label: '❌ Reddedilenler', color: '#e74c3c' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setLeaveTab(tab.id)}
                        style={{
                            padding: '12px 24px', borderRadius: '12px', border: 'none',
                            cursor: 'pointer', fontWeight: 'bold',
                            backgroundColor: leaveTab === tab.id ? tab.color : 'transparent',
                            color: leaveTab === tab.id ? 'white' : '#7f8c8d',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Dinamik Kart Alanı */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '25px' }}>
                {filteredData.length > 0 ? (
                    filteredData.map((req) => (
                        <div key={req.id} style={{
                            background: 'white', borderRadius: '22px', padding: '25px',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            {/* Durum Çizgisi */}
                            <div style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px',
                                backgroundColor: leaveTab === 'pending' ? '#ffc107' : leaveTab === 'approved' ? '#2ecc71' : '#e74c3c'
                            }}></div>

                            {/* Doktor Bilgisi */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                <div style={{ width: '45px', height: '45px', background: '#f0f2f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {req.first_name ? req.first_name[0] : 'D'}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{req.title} {req.first_name} {req.last_name}</h3>
                                    <span style={{ fontSize: '0.85rem', color: '#95a5a6' }}>{req.specialization}</span>
                                </div>
                            </div>

                            {/* Tarih ve Durum Kutusu */}
                            <div style={{ background: '#fbfbfb', padding: '15px', borderRadius: '15px', marginBottom: '20px', border: '1px solid #f1f1f1' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>İzin Tarihi:</span>
                                    <strong style={{ color: '#2c3e50' }}>{new Date(req.start_date).toLocaleDateString('tr-TR')}</strong>
                                </div>
                                <small style={{ color: leaveTab === 'pending' ? '#ffc107' : leaveTab === 'approved' ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                                    {leaveTab === 'pending' ? '● ONAY BEKLİYOR' : leaveTab === 'approved' ? '✓ ONAYLANDI' : '✕ REDDEDİLDİ'}
                                </small>
                            </div>

                            {/* Sadece Bekleyenlerde Butonları Göster */}
                            {leaveTab === 'pending' && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleApproveLeave(req.id, req.doctor_id, req.start_date)}
                                        style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#2ecc71', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                                    >Onayla</button>
                                    <button
                                        onClick={() => handleRejectLeave(req.id)}
                                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #e74c3c', backgroundColor: 'transparent', color: '#e74c3c', fontWeight: 'bold', cursor: 'pointer' }}
                                    >Reddet</button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#bdc3c7' }}>
                        <div style={{ fontSize: '3.5rem' }}>🍃</div>
                        <p>Bu kategoride herhangi bir talep bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- CSS-in-JS STİL OBJELERİ ---

const requestCardStyle = (type) => ({
    background: 'white', borderRadius: '22px', padding: '25px',
    boxShadow: '0 12px 30px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
    position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease'
});

const avatarCircleStyle = {
    width: '45px', height: '45px', background: '#f0f2f5', borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', color: '#57606f', fontSize: '0.9rem'
};

const infoBoxStyle = {
    background: '#fbfbfb', padding: '15px', borderRadius: '15px',
    marginBottom: '20px', border: '1px solid #f1f1f1'
};

const primaryBtnStyle = (color) => ({
    flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
    backgroundColor: color, color: 'white', fontWeight: 'bold',
    cursor: 'pointer', transition: 'transform 0.2s ease'
});

const secondaryBtnStyle = (color) => ({
    flex: 1, padding: '12px', borderRadius: '12px', border: `1.5px solid ${color}`,
    backgroundColor: 'transparent', color: color, fontWeight: 'bold',
    cursor: 'pointer'
});

function renderEmptyState(text, icon) {
    return (
        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#bdc3c7' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>{icon}</div>
            <p style={{ fontSize: '1.1rem' }}>{text}</p>
        </div>
    );
}
//ANA RETURN BLOĞU
        return (
            <div className="app-layout">
                {/* MODALLAR */}
                {renderEditDoctorModal()}
                {renderClinicDetailModal()}
                {renderDoctorDetailsModal()}

                {/* SOL MENÜ (Sidebar) */}
               <aside className="app-sidebar">
                   <div>
                     <h2 className="app-sidebar-title">Cankaya Hospital</h2>
                     <p className="app-sidebar-subtitle">@{user?.username || "admin"} · yönetici</p>

                     <div className="sidebar-buttons">
                           <button className={"sidebar-button " + (activeSection === "overview" ? "sidebar-button-active" : "")} onClick={() => setActiveSection("overview")}>Genel Bakış</button>
                           <button className={"sidebar-button " + (activeSection === "doctors" ? "sidebar-button-active" : "")} onClick={() => setActiveSection("doctors")}>Doktorlar</button>
                           <button className={"sidebar-button " + (activeSection === "patients" ? "sidebar-button-active" : "")} onClick={() => setActiveSection("patients")}>Hastalar</button>
                           <button className={"sidebar-button " + (activeSection === "clinics" ? "sidebar-button-active" : "")} onClick={() => setActiveSection("clinics")}>Poliklinikler</button>
                           <button className={"sidebar-button " + (activeSection === "reports" ? "sidebar-button-active" : "")} onClick={() => setActiveSection("reports")}>Raporlar</button>
                           <button className={"sidebar-button " + (activeSection === "performance" ? "sidebar-button-active" : "")} onClick={() => setActiveSection("performance")}> Performanslar</button>
                          <button className={"sidebar-button " + (activeSection === "leaves" ? "sidebar-button-active" : "")} onClick={() => { setActiveSection("leaves"); fetchLeaveRequests(); }}  >
                              İzin Talepleri
                          </button>
                           {/* Sistem Hareketleri Butonu */}
                           <button
                               className={"sidebar-button " + (activeSection === "logs" ? "sidebar-button-active" : "")}
                               onClick={() => { setActiveSection("logs"); fetchLogs(); }}>
                               Sistem Hareketleri
                           </button>
                       </div>
                   </div>
                  <button className="logout-button" onClick={onLogout}>Çıkış</button>
               </aside>

                {/* SAĞ İÇERİK (Main Content) */}
                <main className="app-main">
                    {activeSection === "overview" && renderOverview()}
                    {activeSection === "doctors" && renderDoctorsList()}
                    {activeSection === "patients" && renderPatientsList()}
                    {activeSection === "clinics" && renderClinics()}
                    {activeSection === "reports" && renderReports()}
                    {activeSection === "performance" && renderPerformance()}
                    {activeSection === "logs" && renderLogs()}
                    {activeSection === "add" && renderAddUser()}
                    {activeSection === "leaves" && renderLeaveManagement()}
                </main>

            </div>

        );    }