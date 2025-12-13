// src/pages/DoctorPage.jsx (NİHAİ VE TAM HALİ)

import { useEffect, useState } from "react";
import "../styles/layout.css";
import React from 'react';
import {
    getDoctorAppointments,
    getPatientByTc,
    updateAppointmentStatus
} from "../services/api";

// Helper: Tarihi YYYY-MM-DD formatından yerel formata çevirir
const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        // Tarih ve saat bilgisini ayırıp sadece tarihi yerel formata çevirir.
        return new Date(dateString.split(' ')[0]).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
        return 'Format Hatası';
    }
};

// Helper: Belirli bir tarihin başlangıcını döndürür (Saati sıfırlar)
const getStartOfDay = (daysOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(0, 0, 0, 0);
    return date;
};

// Helper: Sadece tarihi döndürür (YYYY-MM-DD)
const getShortDate = (date) => {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toISOString().split('T')[0];
};


export default function DoctorPage({ user, onLogout }) {
    // --- Randevu ve Yükleme State'leri ---
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const doctorUserId = user.id;

    const [activeSection, setActiveSection] = useState("panel");

    // --- FİLTRE STATE'LERİ ---
    const [dateFilter, setDateFilter] = useState('today'); // today, tomorrow, next_7_days, all
    const [statusFilter, setStatusFilter] = useState('all'); // all, scheduled, completed, canceled

    // Hasta Sorgulama state'leri
    const [searchTc, setSearchTc] = useState("");
    const [patientInfo, setPatientInfo] = useState(null);
    const [patientError, setPatientError] = useState("");

    // Modal ve Detay State'leri
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [doctorNote, setDoctorNote] = useState('');


    // --- 1. Randevuları Çekme ---
    const fetchAppointments = async () => {
        if (!doctorUserId) {
            console.error("Doktor Kullanıcı ID'si bulunamadı.");
            return;
        }

        try {
            setLoading(true);
            const response = await getDoctorAppointments(doctorUserId);
            const appointmentsData = Array.isArray(response.data) ? response.data : [];

            if (appointmentsData.length > 0) {
                const mappedAppointments = appointmentsData.map((a) => ({
                    id: a.id,
                    appointment_date: a.appointment_date,
                    time: new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    patientId: a.patient_id,
                    patientName: `${a.patient_first_name} ${a.patient_last_name}`,
                    tc_no: a.tc_no,
                    reason: a.reason,
                    status: a.status,
                    doctor_note: a.doctor_note || "",
                }));
                setAppointments(mappedAppointments);
            } else {
                setAppointments([]);
            }
        } catch (err) {
            console.error("Randevuları çekme hatası:", err);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        fetchAppointments();
    }, [doctorUserId]);


    // --- 2. Detay Görüntüleme ve Hasta Bilgisi Çekme ---
    const handleDetailsClick = async (appointment) => {
        setSelectedAppointment(appointment);
        setDoctorNote(appointment.doctor_note || '');
        setPatientDetails(null);

        try {
            // Hasta TC'si ile tüm profil detaylarını çek
            const response = await getPatientByTc(appointment.tc_no);
            setPatientDetails(response.data);
        } catch (error) {
            console.error("Hasta detayları çekilemedi:", error);
        }
    };

    const closeModal = () => {
        setSelectedAppointment(null);
        setPatientDetails(null);
        setDoctorNote('');
    };

    // --- 3. Muayene Notunu Kaydetme ---
    const handleSaveNote = async () => {
        if (!selectedAppointment) return;

        try {
            // Notu kaydetmek için mevcut status'ü gönderiyoruz
            await updateAppointmentStatus(
                selectedAppointment.id,
                selectedAppointment.status,
                doctorNote
            );

            // Frontend listesini ve seçili randevuyu güncelle
            setAppointments(prev => prev.map(app =>
                app.id === selectedAppointment.id ? { ...app, doctor_note: doctorNote } : app
            ));

            setSelectedAppointment(prev => ({ ...prev, doctor_note: doctorNote }));

            alert("Doktor notu başarıyla kaydedildi.");

        } catch (error) {
            console.error("Not kaydedilemedi:", error);
            alert("Not kaydedilirken hata oluştu.");
        }
    };

    // --- 4. Durumu Güncelleme (Hızlı İşlem veya Modal) ---
    const handleUpdateAppointment = async (appointmentId, newStatus, currentNote = '') => {

        // Modal açıksa ve not alanı doluysa modal'daki notu kullan, yoksa mevcut notu kullan.
        const noteToUse = selectedAppointment ? doctorNote : currentNote;

        const actionText = newStatus === 'completed' ? "tamamlandı" : "iptal edildi";
        const confirm = window.confirm(`Bu randevuyu ${actionText} olarak işaretlemek istediğinizden emin misiniz?`);
        if (!confirm) return;

        try {
            // Backend çağrısı (Not alanını da gönderiyoruz)
            await updateAppointmentStatus(appointmentId, newStatus, noteToUse);

            // Başarılı olursa listeyi yenile
            fetchAppointments();
            closeModal();
            alert(`Randevu ${actionText} olarak işaretlendi.`);
        } catch (error) {
            console.error("Durum güncellenemedi:", error);
            alert("Randevu durumu güncellenirken hata oluştu.");
        }
    };


    // --- HASTA SORGULAMA ---
    async function handleSearchTc(e) {
        e.preventDefault();
        setPatientError("");
        setPatientInfo(null);

        const trimmed = searchTc.trim();
        if (!trimmed) {
            setPatientError("Lütfen TC Kimlik No girin.");
            return;
        }

        try {
            const response = await getPatientByTc(trimmed);
            setPatientInfo(response.data);
        } catch (error) {
            const errorMessage = error.response?.data || "Bu TC kimlik numarasına ait hasta bulunamadı.";
            setPatientError(errorMessage);
            console.error("Hasta sorgulama hatası:", error);
        }
    }


    // --- YARDIMCI GÖRÜNÜM FONKSİYONLARI ---

    function getStatusText(status) {
         if (status === 'scheduled') return 'Bekliyor';
         if (status === 'completed') return 'Tamamlandı';
         if (status === 'canceled') return 'İptal Edildi';
         return 'Bilinmiyor';
    }

    function getStatusClass(status) {
        switch (status) {
            case "scheduled":
                return "status-badge status-bekliyor";
            case "completed":
                return "status-badge status-muayene";
            case "canceled":
                return "status-badge status-gelmedi";
            default:
                return "status-badge";
        }
    }

    // --- FİLTRELEME MANTIĞI ---
    const filterAppointments = () => {
        const todayShort = getShortDate(new Date());
        const tomorrowShort = getShortDate(getStartOfDay(1));
        const next7DaysEnd = getStartOfDay(7); // Bugün + 7 günün başı

        return appointments.filter(app => {
            const appointmentDate = new Date(app.appointment_date);
            const appDateShort = getShortDate(appointmentDate);

            const statusMatch = statusFilter === 'all' || app.status === statusFilter;
            let dateMatch = false;

            // Tarih filtrelemesi
            if (dateFilter === 'all') {
                dateMatch = true;
            } else if (dateFilter === 'today') {
                dateMatch = appDateShort === todayShort;
            } else if (dateFilter === 'tomorrow') {
                 dateMatch = appDateShort === tomorrowShort;
            } else if (dateFilter === 'next_7_days') {
                // Bugün ve gelecek 7 gün içindeki randevular (Bugünü dahil et)
                const today = getStartOfDay(0);
                dateMatch = appointmentDate >= today && appointmentDate < next7DaysEnd;
            }

            return statusMatch && dateMatch;
        });
    };

    const filteredAppointments = filterAppointments();


    // --- RENDER MODAL ---
    function renderAppointmentDetailModal() {
        if (!selectedAppointment) return null;

        const app = selectedAppointment;

        return (
            <div className="modal-backdrop">
                <div className="modal appointment-detail-modal">
                    <h3>{app.patientName} Randevu Detayları</h3>

                    {patientDetails ? (
                        <div className="detail-grid">
                            {/* Randevu Bilgileri */}
                            <div className="detail-section">
                                <h4>📅 Randevu Bilgileri</h4>
                                <p><strong>Tarih:</strong> {new Date(app.appointment_date).toLocaleDateString()}</p>
                                <p><strong>Saat:</strong> {app.time}</p>
                                <p><strong>Şikayet:</strong> {app.reason}</p>
                                <p><strong>Durum:</strong> {getStatusText(app.status)}</p>
                            </div>

                            {/* Hasta Bilgileri */}
                            <div className="detail-section">
                                <h4>👤 Hasta Profili</h4>
                                <p><strong>TC No:</strong> {patientDetails.tc_no || 'Bilinmiyor'}</p>
                                <p><strong>Doğum Tarihi:</strong> {formatDate(patientDetails.date_of_birth) || 'Bilinmiyor'}</p>
                                <p><strong>Cinsiyet:</strong> {patientDetails.gender || 'Bilinmiyor'}</p>
                                <p><strong>Kan Grubu:</strong> {patientDetails.blood_type || 'Bilinmiyor'}</p>
                                <p><strong>Alerjiler:</strong> {patientDetails.allergies || 'Yok'}</p>
                                <p><strong>Hastalıklar:</strong> {patientDetails.diseases || 'Yok'}</p>
                                <p><strong>Boy/Kilo:</strong> {patientDetails.height || '-'} cm / {patientDetails.weight || '-'} kg</p>
                            </div>
                        </div>
                    ) : (
                        <p style={{textAlign: 'center', margin: '20px 0'}}>Hasta detayları yükleniyor veya TC numarasıyla profili çekilemedi.</p>
                    )}

                    <div className="form-field full-width" style={{marginTop: '20px'}}>
                        <label>✍️ Doktor Notu (Muayene sırasında veya sonrasında kaydedin)</label>
                        <textarea
                            className="form-input"
                            rows="5"
                            value={doctorNote}
                            onChange={(e) => setDoctorNote(e.target.value)}
                            placeholder="Muayene bulgularınızı, tedavi planınızı veya önemli gözlemlerinizi buraya yazın."
                        />
                    </div>

                    <div className="modal-actions">
                        <button onClick={handleSaveNote} className="modal-button modal-save">
                            Notu Kaydet
                        </button>
                        {app.status === 'scheduled' && (
                            <button onClick={() => handleUpdateAppointment(app.id, 'completed')} className="modal-button modal-complete">
                                Tamamla
                            </button>
                        )}
                        <button onClick={closeModal} className="modal-button modal-cancel">
                            Kapat
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const sectionButtonClass = (section) =>
        "sidebar-button" +
        (activeSection === section ? " sidebar-button-active" : "");


    // --- ANA RENDER ---
    return (
        <div className="app-layout">
            {renderAppointmentDetailModal()}

            {/* SOL: SIDEBAR */}
            <aside className="app-sidebar">
                <div>
                    <h2 className="app-sidebar-title">Cankaya Hospital</h2>
                    <p className="app-sidebar-subtitle">@{user.username} · doctor</p>

                    <div className="sidebar-buttons">
                        {/* DOKTOR PANELİ */}
                        <button
                            className={sectionButtonClass("panel")}
                            onClick={() => setActiveSection("panel")}
                        >
                            Randevular
                        </button>

                        {/* HASTA SORGULA */}
                        <button
                            className={sectionButtonClass("search")}
                            onClick={() => setActiveSection("search")}
                            style={{ marginTop: "8px" }}
                        >
                            Hasta Sorgula
                        </button>

                        {activeSection === "search" && (
                            <form className="search-form" onSubmit={handleSearchTc}>
                                <input
                                    type="text"
                                    placeholder="TC Kimlik No"
                                    value={searchTc}
                                    onChange={(e) => setSearchTc(e.target.value)}
                                    className="search-input"
                                />
                                <button type="submit" className="search-button">
                                    Ara
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <button onClick={onLogout} className="logout-button">
                    Çıkış
                </button>
            </aside>

            {/* SAĞ: BODY */}
            <main className="app-main">
                {/* --- HASTA SORGULA: HASTA BİLGİLERİ --- */}
                {activeSection === "search" && (
                    <div className="card">
                        <h2>Hasta Bilgileri</h2>

                        {patientError && (
                            <p style={{ color: "red", marginTop: "8px" }}>{patientError}</p>
                        )}

                        {!patientInfo && !patientError && (
                            <p style={{ fontSize: "14px", color: "#555", marginTop: "8px" }}>
                                Lütfen sol taraftan TC Kimlik No girerek bir hasta arayın.
                            </p>
                        )}

                        {patientInfo && (
                            <div style={{ marginTop: "12px" }}>
                                <table style={{ borderCollapse: "collapse", fontSize: "14px", color: "#555", width: '100%' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600, width: '150px' }}>Ad Soyad</td>
                                            <td style={{ padding: "4px 0" }}>{patientInfo.first_name} {patientInfo.last_name}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600 }}>TC Kimlik No</td>
                                            <td style={{ padding: "4px 0" }}>{patientInfo.tc_no}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600 }}>Doğum Tarihi</td>
                                            <td style={{ padding: "4px 0" }}>{formatDate(patientInfo.date_of_birth) || 'Bilinmiyor'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* --- DOKTOR PANELİ: RANDEVULAR --- */}
                {activeSection === "panel" && (
                    <>
                        <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>
                            Randevular
                        </h1>

                        <div className="card">

                             {/* FİLTRELEME ARAYÜZÜ */}
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>

                                {/* Tarih Filtresi */}
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Tarih Aralığı</label>
                                    <select
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        className="form-input"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="today">Bugün</option>
                                        <option value="tomorrow">Yarın</option>
                                        <option value="next_7_days">Gelecek 7 Gün</option>
                                        <option value="all">Tüm Randevular</option>
                                    </select>
                                </div>

                                {/* Durum Filtresi */}
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Durum</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="form-input"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="all">Tümü</option>
                                        <option value="scheduled">Bekliyor</option>
                                        <option value="completed">Tamamlandı</option>
                                        <option value="canceled">İptal Edildi</option>
                                    </select>
                                </div>
                            </div>
                            {/* FİLTRELEME ARAYÜZÜ SONU */}


                            {loading ? (
                                <p>Yükleniyor...</p>
                            ) : filteredAppointments.length === 0 ? (
                                <p>Seçilen filtreye uygun randevu bulunmamaktadır.</p>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ textAlign: "left", fontSize: "14px", color: "#6b7280" }}>
                                            <th>Tarih</th>
                                            <th>Saat</th>
                                            <th>Hasta Adı</th>
                                            <th>Neden</th>
                                            <th>Durum</th>
                                            <th>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAppointments.map((a) => (
                                            <tr key={a.id}>
                                                <td>{formatDate(a.appointment_date)}</td>
                                                <td>{a.time}</td>
                                                <td>{a.patientName}</td>
                                                <td>{a.reason}</td>
                                                <td>
                                                    <span className={getStatusClass(a.status)}>
                                                        {getStatusText(a.status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="action-button details-button"
                                                        onClick={() => handleDetailsClick(a)}
                                                        style={{ marginRight: '5px' }}
                                                    >
                                                        Detay
                                                    </button>

                                                    {/* HIZLI İŞLEM BUTONLARI */}
                                                    {a.status === 'scheduled' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="action-button action-success"
                                                                onClick={() => handleUpdateAppointment(a.id, 'completed', a.doctor_note)}
                                                                title="Tamamlandı olarak işaretle"
                                                                style={{ marginRight: '5px' }}
                                                            >
                                                                 Tamamla
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="action-button action-danger"
                                                                onClick={() => handleUpdateAppointment(a.id, 'canceled', a.doctor_note)}
                                                                title="İptal edildi olarak işaretle"
                                                            >
                                                                 İptal Et
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}