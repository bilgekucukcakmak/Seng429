// src/pages/DoctorPage.jsx (NİHAİ VE TAM HALİ - Profil Görüntüleme/Düzenleme Geçişi Eklendi)

import { useEffect, useState } from "react";
import "../styles/layout.css";
import React from 'react';
import {
    getDoctorAppointments,
    getPatientByTc,
    updateAppointmentStatus,
    updateDoctorProfile, // Profil güncelleme API'si
    getDoctorProfile
} from "../services/api";

// --- SABİT TANIMLAMALAR ---
const DAYS_OF_WEEK = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const LEAVE_STORAGE_KEY = 'doctor_leave_dates';

// Sabit çalışma saatleri
const FIXED_SCHEDULE = {
    "Pazartesi": { start: "09:00", end: "17:00" },
    "Salı": { start: "09:00", end: "17:00" },
    "Çarşamba": { start: "09:00", end: "17:00" },
    "Perşembe": { start: "09:00", end: "17:00" },
    "Cuma": { start: "09:00", end: "17:00" },
    "Cumartesi": null,
    "Pazar": null,
};


// --- TARİH YARDIMCI FONKSİYONLARI ---
const formatDate = (dateInput) => {
    if (!dateInput) return '';
    let date;
    if (dateInput instanceof Date) { date = dateInput; } else if (typeof dateInput === 'string') { date = new Date(dateInput.split(' ')[0]); } else { return ''; }
    if (isNaN(date.getTime())) { return ''; }
    try {
        return date.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch { return ''; }
};
const getShortDate = (date) => {
    if (!(date instanceof Date)) { date = new Date(date); }
    return date.toISOString().split('T')[0];
};
const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};
const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};


// --- COMPONENT BAŞLANGICI ---
export default function DoctorPage({ user, onLogout }) {

    // --- Randevu, Yükleme ve Genel State'ler ---
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const doctorUserId = user.id;
    const [activeSection, setActiveSection] = useState("panel");

    // --- TAKVİM VE İZİN YÖNETİMİ STATE'LERİ ---
    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
    const [leaveDates, setLeaveDates] = useState([]); // İzinli günler (YYYY-MM-DD formatında)
    const [leaveDateInput, setLeaveDateInput] = useState(''); // İzin ekleme inputu

    // --- PROFİL YÖNETİMİ STATE'LERİ (YENİ EKLENDİ) ---
    const [isEditingProfile, setIsEditingProfile] = useState(false); // YENİ STATE: Görüntüleme/Düzenleme geçişi
    const [profileData, setProfileData] = useState({
        // user objesinden gelen olası alan isimlerini kullan
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        email: user.email || '',
        specialization: user.specialization || 'Yükleniyor...', // Admin tarafından atanan branş
        title: user.title || 'Dr.', // Unvan bilgisini ekledik
        newPassword: '',
        confirmNewPassword: ''
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    // --- FİLTRE VE DİĞER STATE'LER ---
    const [dateFilter, setDateFilter] = useState('today');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTc, setSearchTc] = useState("");
    const [patientInfo, setPatientInfo] = useState(null);
    const [patientError, setPatientError] = useState("");
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [doctorNote, setDoctorNote] = useState('');
    const [quickPatientInfo, setQuickPatientInfo] = useState(null);


    // --- useEffect: İzinleri LocalStorage'dan Çekme ve Kaydetme ---

    // 1. İzinleri yükle (Sayfa ilk yüklendiğinde çalışır)
    useEffect(() => {
        const storedLeave = localStorage.getItem(LEAVE_STORAGE_KEY);
        if (storedLeave) {
            try {
                const parsedLeave = JSON.parse(storedLeave);
                if (Array.isArray(parsedLeave)) {
                    const todayShort = getShortDate(new Date());
                    const futureLeaves = parsedLeave.filter(date => date >= todayShort);
                    setLeaveDates(futureLeaves);
                } else {
                    setLeaveDates([]);
                }
            } catch (error) {
                setLeaveDates([]);
            }
        }
    }, []);

    // 2. İzinler değişince kaydet ve Backend'e gönder
    useEffect(() => {
        localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(leaveDates));

        // Backend entegrasyonu (Yapıldıysa çalışır)
        // if (doctorUserId && typeof updateDoctorLeaveDates === 'function') {
        //     updateDoctorLeaveDates(leaveDates).catch(err => {
        //         console.error("İzinler Backend'e gönderilemedi:", err);
        //     });
        // }
    }, [leaveDates, doctorUserId]);


    // --- PROFİL YÖNETİMİ FONKSİYONLARI (YENİ EKLENDİ) ---
    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage({ type: '', text: '' });

        const { firstName, lastName, email, newPassword, confirmNewPassword } = profileData;

        // Validasyonlar
        if (newPassword && newPassword !== confirmNewPassword) {
            setProfileMessage({ type: 'error', text: 'Yeni şifreler uyuşmuyor.' });
            setProfileLoading(false);
            return;
        }

        const updates = {
            firstName,
            lastName,
            email
        };

        if (newPassword) {
            updates.password = newPassword;
        }

        try {
            await updateDoctorProfile(updates);

            setProfileMessage({ type: 'success', text: 'Profil bilgileri başarıyla güncellendi. Yeni şifre kullandıysanız, bir sonraki girişte geçerli olacaktır.' });

            setProfileData(prev => ({
                ...prev,
                firstName: updates.firstName,
                lastName: updates.lastName,
                email: updates.email,
                newPassword: '',
                confirmNewPassword: ''
            }));

            // Başarılı güncelleme sonrası GÖRÜNTÜLEME moduna geç
            setIsEditingProfile(false); // <--- ÖNEMLİ GEÇİŞ

            if (updates.email !== user.email) {
                 alert("E-posta güncellendi. Değişikliğin tam olarak uygulanması için lütfen çıkış yapıp tekrar giriş yapın.");
            }

        } catch (error) {
            const msg = error.response?.data || "Güncelleme sırasında bir hata oluştu.";
            setProfileMessage({ type: 'error', text: msg });
        } finally {
            setProfileLoading(false);
        }
    };


    // --- İZİN YÖNETİMİ FONKSİYONLARI ---

    const handleAddLeave = (dateString) => {
        if (!dateString) return;

        const today = getShortDate(new Date());
        if (dateString < today) {
            alert("Geçmiş bir tarih için izin ekleyemezsiniz.");
            return;
        }

        if (leaveDates.includes(dateString)) {
            alert("Bu tarih zaten izinli günler listenizde.");
            return;
        }

        setLeaveDates(prev => [...prev, dateString].sort());
        alert(`${formatDate(dateString)} için izin başarıyla eklendi.`);
    };

    const handleRemoveLeave = (dateString) => {
        setLeaveDates(prev => prev.filter(date => date !== dateString));
        alert(`${formatDate(dateString)} için izin başarıyla kaldırıldı.`);
    };


    // --- Randevuları Çekme ---
    const fetchAppointments = async () => {
        if (!doctorUserId) return;
        try {
            setLoading(true);
            const response = await getDoctorAppointments();
            const appointmentsData = Array.isArray(response.data) ? response.data : [];

            if (appointmentsData.length > 0) {
                const mappedAppointments = appointmentsData.map((a) => ({
                    id: a.id,
                    appointment_date: a.appointment_date,
                    time: new Date(a.appointment_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
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


    // --- HIZLI HASTA BİLGİSİ İŞLEMLERİ ---
    const handleQuickPatientInfoClick = async (tcNo, patientName) => {
        setQuickPatientInfo({ name: patientName, loading: true, data: null, error: null });

        try {
            const response = await getPatientByTc(tcNo);

            const dob = response.data.date_of_birth ? new Date(response.data.date_of_birth) : null;
            const age = dob ? new Date().getFullYear() - dob.getFullYear() : 'Bilinmiyor';
            const phone = response.data.phone_number || response.data.phone || 'N/A';
            const email = response.data.email || 'N/A';

            setQuickPatientInfo({
                name: patientName,
                loading: false,
                data: {
                    ...response.data,
                    age: age,
                    phone_number: phone,
                    email: email,
                },
                error: null
            });
        } catch (error) {
            setQuickPatientInfo({
                name: patientName,
                loading: false,
                data: null,
                error: "Hasta detayları bulunamadı veya TC numarası eksik."
            });
        }
    };

    const closeQuickPatientInfo = () => {
        setQuickPatientInfo(null);
    };

    // --- DETAY GÖRÜNTÜLEME VE NOT İŞLEMLERİ ---
    const handleDetailsClick = async (appointment) => {
        setSelectedAppointment(appointment);
        setDoctorNote(appointment.doctor_note || '');
        setPatientDetails(null);

        try {
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

    const handleSaveNote = async () => {
        if (!selectedAppointment) return;

        try {
            await updateAppointmentStatus(
                selectedAppointment.id,
                selectedAppointment.status,
                doctorNote
            );

            setAppointments(prev => prev.map(app =>
                app.id === selectedAppointment.id ? { ...app, doctor_note: doctorNote } : app
            ));

            setSelectedAppointment(prev => ({ ...prev, doctor_note: doctorNote }));

            alert("Doktor notu başarıyla kaydedildi.");

        } catch (error) {
            alert("Not kaydedilirken hata oluştu.");
        }
    };

    const handleUpdateAppointment = async (appointmentId, newStatus, currentNote = '') => {

        const noteToUse = selectedAppointment ? doctorNote : currentNote;

        const actionText = newStatus === 'completed' ? "tamamlandı" : "iptal edildi";
        const confirm = window.confirm(`Bu randevuyu ${actionText} olarak işaretlediğinizden emin misiniz?`);
        if (!confirm) return;

        try {
            await updateAppointmentStatus(appointmentId, newStatus, noteToUse);

            fetchAppointments();
            closeModal();
            alert(`Randevu ${actionText} olarak işaretlendi.`);
        } catch (error) {
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
        // Tarih filtrelemesi için yardımcı fonksiyonlar
        const getStartOfDay = (daysOffset = 0) => {
            const date = new Date();
            date.setDate(date.getDate() + daysOffset);
            date.setHours(0, 0, 0, 0);
            return date;
        };

        const todayShort = getShortDate(new Date());
        const tomorrowShort = getShortDate(getStartOfDay(1));
        const next7DaysEnd = getStartOfDay(7);

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
                const today = getStartOfDay(0);
                dateMatch = appointmentDate >= today && appointmentDate < next7DaysEnd;
            }

            return statusMatch && dateMatch;
        });
    };

    const filteredAppointments = filterAppointments();


    // --- TAKVİM NAVİGASYON HANDLERS ---
    const handlePreviousWeek = () => {
        setCurrentWeekStart(prev => addDays(prev, -7));
    };

    const handleNextWeek = () => {
        setCurrentWeekStart(prev => addDays(prev, 7));
    };


    // --- RENDER HIZLI HASTA BİLGİ MODALI ---
    function renderQuickPatientInfoModal() {
        if (!quickPatientInfo) return null;

        const { name, loading, data, error } = quickPatientInfo;

        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ maxWidth: '400px' }}>
                    <h3>👤 {name} - Temel Bilgiler</h3>

                    {loading && <p>Hasta bilgileri yükleniyor...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    {data && (
                        <div className="detail-grid" style={{ marginTop: '15px' }}>
                            <div className="profile-label">TC Kimlik No</div>
                            <div className="profile-value">{data.tc_no || 'N/A'}</div>

                            <div className="profile-label">Yaş</div>
                            <div className="profile-value">{data.age}</div>

                            <div className="profile-label">Doğum Tarihi</div>
                            <div className="profile-value">{formatDate(data.date_of_birth) || 'N/A'}</div>

                            <div className="profile-label">Cinsiyet</div>
                            <div className="profile-value">{data.gender || 'N/A'}</div>

                            <div className="profile-label">Telefon</div>
                            <div className="profile-value">{data.phone_number || 'N/A'}</div>

                            <div className="profile-label">E-posta</div>
                            <div className="profile-value">{data.email || 'N/A'}</div>
                        </div>
                    )}

                    <div className="modal-actions" style={{ marginTop: '20px' }}>
                         <button onClick={closeQuickPatientInfo} className="modal-button modal-cancel">
                            Kapat
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER APPOINTMENT DETAY MODALI ---
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


    // --- YENİ BİLEŞEN: İZİN YÖNETİMİ ---
    function renderLeaveManagement() {
        const sortedLeaveDates = [...leaveDates].sort();

        return (
            <>
                <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>
                    İzin Yönetimi
                </h1>
                <div className="card">
                    <h3>İzin Ekle</h3>
                    {/* HİZALAMA DÜZELTİLDİ */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '30px' }}>

                        {/* Tarih Seçici */}
                        <div className="form-group" style={{ flex: 1, maxWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>İzin Tarihi Seçin</label>
                            <input
                                type="date"
                                className="form-input"
                                value={leaveDateInput}
                                onChange={(e) => setLeaveDateInput(e.target.value)}
                                min={getShortDate(new Date())} // Bugün ve sonrası seçilebilir
                            />
                        </div>

                        {/* Ekle Butonu - SARI YAPILDI */}
                        <button
                            onClick={() => {
                                if (leaveDateInput) {
                                    handleAddLeave(leaveDateInput);
                                    setLeaveDateInput('');
                                }
                            }}
                            style={{
                                height: '38px',
                                whiteSpace: 'nowrap',
                                backgroundColor: '#ffc107', // Sarı renk
                                color: '#333',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                padding: '8px 15px',
                                fontWeight: 600
                            }}
                            disabled={!leaveDateInput || leaveDates.includes(leaveDateInput) || leaveDateInput < getShortDate(new Date())}
                        >
                            İzin Ekle
                        </button>
                    </div>

                    <h3>Kayıtlı İzinli Günler ({leaveDates.length})</h3>
                    {leaveDates.length === 0 ? (
                        <p style={{ color: '#555' }}>Kayıtlı izinli gününüz bulunmamaktadır.</p>
                    ) : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                            {sortedLeaveDates.map(dateKey => (
                                <div
                                    key={dateKey}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}
                                >
                                    <span style={{ fontWeight: 600 }}>
                                        {formatDate(dateKey)}
                                        (<span style={{ color: '#555', fontWeight: 400 }}>
                                            {new Date(dateKey).toLocaleDateString('tr-TR', { weekday: 'long' })}
                                        </span>)
                                    </span>
                                    <button
                                        className="action-button action-danger"
                                        onClick={() => handleRemoveLeave(dateKey)}
                                        style={{ padding: '4px 8px', fontSize: '13px' }}
                                    >
                                        Kaldır
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </>
        );
    }

    // ---------------------------------------------------------------------
    // --- PROFİL YÖNETİMİ BİLEŞENLERİ (Görüntüleme/Düzenleme Geçişi) ---
    // ---------------------------------------------------------------------
// --- PROFİL BİLGİLERİNİ BACKEND'DEN ÇEK (ZORUNLU) ---
useEffect(() => {
    async function fetchDoctorProfile() {
        try {
            setProfileLoading(true);

            const response = await getDoctorProfile();
            const data = response.data;

            setProfileData(prev => ({
                ...prev,
                firstName: data.first_name || '',
                lastName: data.last_name || '',
                email: data.email || '',
                specialization: data.specialization || 'Belirtilmedi',
                title: data.title || 'Dr.',
                newPassword: '',
                confirmNewPassword: ''
            }));

        } catch (error) {
            console.error("Doktor profili alınamadı:", error);
            setProfileMessage({
                type: 'error',
                text: 'Profil bilgileri yüklenemedi.'
            });
        } finally {
            setProfileLoading(false);
        }
    }

    fetchDoctorProfile();
}, []);

    // --- 1. RENDER PROFİL GÖRÜNTÜLEME MODU (DÜZELTİLDİ) ---
    function renderProfileView() {
        return (
            <>
                <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>
                    👤 Profil Bilgileri
                </h1>
                <div className="card">
                    <div className="detail-grid" style={{ columnGap: '20px', gridTemplateColumns: '1fr 1fr', rowGap: '15px' }}>

                        {/* Ad Soyad - DÜZELTİLDİ */}
                        <div className="profile-label">Ad Soyad</div>
                        <div className="profile-value" style={{ fontWeight: 'bold' }}>{profileData.firstName} {profileData.lastName}</div>

                        {/* E-posta */}
                        <div className="profile-label">E-posta</div>
                        <div className="profile-value">{profileData.email}</div>

                        {/* Unvan */}
                        <div className="profile-label">Unvan</div>
                        <div className="profile-value">{profileData.title}</div>

                        {/* Branş */}
                        <div className="profile-label">Branş</div>
                        <div className="profile-value">{profileData.specialization}</div>
                    </div>

                    <button
                        className="action-button action-primary"
                        // Düzenleme moduna geçiş yapar ve mesajları temizler
                        onClick={() => { setIsEditingProfile(true); setProfileMessage({ type: '', text: '' }); }}
                        style={{ marginTop: '25px', padding: '10px 20px' }}
                    >
                        Bilgileri Güncelle
                    </button>

                    {profileMessage.text && profileMessage.type === 'success' && (
                        <p style={{ color: 'green', marginTop: '15px', fontWeight: 600 }}>
                            {profileMessage.text}
                        </p>
                    )}
                </div>
            </>
        );
    }


    // --- 2. RENDER PROFİL DÜZENLEME MODU (YENİ EKLENDİ) ---
    function renderProfileEdit() {
        return (
            <>
                <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>
                    ✍️ Hesap Ayarları Düzenle
                </h1>
                <div className="card">
                    <h3>Kişisel Bilgileri Düzenle</h3>

                    {profileMessage.text && (
                        <p style={{ color: profileMessage.type === 'error' ? 'red' : 'green', marginBottom: '15px', fontWeight: 600 }}>
                            {profileMessage.text}
                        </p>
                    )}

                    <form onSubmit={handleProfileSubmit}>
                        <div className="detail-grid" style={{ columnGap: '20px', gridTemplateColumns: '1fr 1fr' }}>

                            {/* Ad ve Soyad */}
                            <div className="form-group">
                                <label>Ad</label>
                                <input type="text" name="firstName" className="form-input" value={profileData.firstName} onChange={handleProfileChange} required />
                            </div>
                            <div className="form-group">
                                <label>Soyad</label>
                                <input type="text" name="lastName" className="form-input" value={profileData.lastName} onChange={handleProfileChange} required />
                            </div>

                            {/* E-posta ve Unvan (Title) */}
                            <div className="form-group">
                                <label>E-posta</label>
                                <input type="email" name="email" className="form-input" value={profileData.email} onChange={handleProfileChange} required />
                            </div>
                            <div className="form-group">
                                <label>Unvan</label>
                                <input type="text" className="form-input" value={profileData.title} disabled style={{ backgroundColor: '#f0f0f0' }} />
                            </div>

                            {/* Branş (Sadece gösterim amaçlı) */}
                            <div className="form-group full-width" style={{ gridColumn: 'span 2' }}>
                                <label>Branş (Değiştirilemez)</label>
                                <input type="text" className="form-input" value={profileData.specialization} disabled style={{ backgroundColor: '#f0f0f0' }} />
                            </div>
                        </div>

                        <h3 style={{ marginTop: '30px' }}>Şifre Güncelleme (Opsiyonel)</h3>
                        <div className="detail-grid" style={{ columnGap: '20px', gridTemplateColumns: '1fr 1fr' }}>

                             <div className="form-group">
                                <label>Yeni Şifre</label>
                                <input type="password" name="newPassword" className="form-input" value={profileData.newPassword} onChange={handleProfileChange} placeholder="Yeni şifreniz" />
                            </div>

                            <div className="form-group">
                                <label>Yeni Şifre (Tekrar)</label>
                                <input type="password" name="confirmNewPassword" className="form-input" value={profileData.confirmNewPassword} onChange={handleProfileChange} placeholder="Yeni şifrenizi tekrar girin" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                            <button
                                type="submit"
                                className="action-button action-success"
                                disabled={profileLoading}
                                style={{ padding: '10px 20px' }}
                            >
                                {profileLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </button>
                            <button
                                type="button"
                                className="action-button modal-cancel"
                                onClick={() => { setIsEditingProfile(false); setProfileMessage({ type: '', text: '' }); }} // Görüntüleme moduna geri dön
                                style={{ padding: '10px 20px' }}
                            >
                                İptal Et
                            </button>
                        </div>
                    </form>
                </div>
            </>
        );
    }


    // --- 3. ANA PROFİL YÖNETİMİ BİLEŞENİ (Geçiş Kontrolü) ---
    function renderProfileManagement() {
        return isEditingProfile ? renderProfileEdit() : renderProfileView();
    }


    // --- GÜNCELLENMİŞ BİLEŞEN: ÇALIŞMA TAKVİMİ (Haftalık Görünüm) ---
    function renderWorkCalendar() {
        const weekStart = currentWeekStart;
        const weekEnd = addDays(currentWeekStart, 6);

        // Haftalık Randevuları Filtreleme
        const appointmentsInCurrentWeek = appointments.filter(app => {
            const appDate = new Date(app.appointment_date);
            return appDate >= weekStart && appDate <= weekEnd;
        });

        // Randevuları tarihe göre gruplama
        const appsByDate = appointmentsInCurrentWeek.reduce((acc, app) => {
            const dateKey = getShortDate(app.appointment_date);
            acc[dateKey] = acc[dateKey] || [];
            acc[dateKey].push(app);
            return acc;
        }, {});

        // Tablo için 7 günlük veriyi hazırlama
        const weekData = [];
        for(let i = 0; i < 7; i++) {
            const date = addDays(weekStart, i);
            const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });
            const dateKey = getShortDate(date);
            const schedule = FIXED_SCHEDULE[dayName];
            const appsCount = appsByDate[dateKey]?.length || 0;
            const isLeaveDay = leaveDates.includes(dateKey); // İZİN KONTROLÜ

            weekData.push({
                date,
                dayName,
                dateKey,
                schedule,
                appsCount,
                isLeaveDay
            });
        }

        // BAŞLIK İÇİN TARİH BİLGİLERİ
        const weekStartText = formatDate(weekStart);
        const weekEndText = formatDate(weekEnd);


        return (
            <>
                <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>
                    Çalışma Takvimi (Haftalık Görünüm)
                </h1>

                <div className="card">

                    {/* NAVİGASYON BUTONLARI VE BAŞLIK */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <button
                            onClick={handlePreviousWeek}
                            className="action-button details-button"
                            style={{ padding: '8px 15px' }}
                        >
                            ← Önceki Hafta
                        </button>

                        <h3 style={{ fontSize: "18px", margin: 0 }}>
                            {weekStartText} - {weekEndText}
                        </h3>

                         <button
                            onClick={handleNextWeek}
                            className="action-button details-button"
                            style={{ padding: '8px 15px' }}
                        >
                            Sonraki Hafta →
                        </button>
                    </div>

                    <p style={{fontSize: '14px', color: '#666', marginBottom: '15px'}}>Görüntülediğiniz hafta aralığındaki randevu yoğunluğunuz aşağıdadır.</p>

                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px" }}>
                        <thead>
                            <tr style={{ textAlign: "left", fontSize: "14px", color: "#6b7280" }}>
                                <th style={{ padding: '8px 0'}}>Gün</th>
                                <th>Çalışma Aralığı</th>
                                <th>Randevu Sayısı</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weekData.map((item) => {
                                const isToday = getShortDate(item.date) === getShortDate(new Date());

                                // SATIR ARKA PLAN RENGİNİ BELİRLEME
                                let rowBgColor = 'inherit';
                                if (item.isLeaveDay) {
                                    rowBgColor = '#fff3cd50'; // Açık Sarı: İzinli Gün
                                } else if (!item.schedule) {
                                    rowBgColor = '#ffe3e350'; // Açık Kırmızı: Kapalı Gün (Hafta Sonu)
                                } else if (isToday) {
                                    rowBgColor = '#f0f8ff'; // Açık Mavi: Bugün
                                }

                                return (
                                    <tr
                                        key={item.dateKey}
                                        style={{backgroundColor: rowBgColor}}
                                    >
                                        <td style={{ fontWeight: 600, padding: '8px 0', color: isToday ? '#007bff' : 'inherit' }}>
                                            {item.dayName}
                                        </td>
                                        <td>
                                            {/* İZİN DURUMUNU GÖSTERME */}
                                            {item.isLeaveDay ? (
                                                <span style={{color: '#856404', fontWeight: 700}}>İZİNLİ</span>
                                            ) : item.schedule ? (
                                                `${item.schedule.start} - ${item.schedule.end}`
                                            ) : (
                                                <span style={{color: '#c82333', fontWeight: 700}}>KAPALI</span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 600,
                                                color: item.appsCount > 0 ? '#1e7e34' : '#6c757d'
                                            }}>
                                                {item.appsCount}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <p style={{fontSize: '13px', color: '#999', marginTop: '20px'}}>Not: Çalışma saatleriniz sabittir. Randevu oluşturulurken çakışma kontrolünü Backend'in yapması gerekmektedir.</p>
                </div>
            </>
        );
    }

    // --- SIDEBAR VE ANA RENDER İŞLEMLERİ ---
    const sectionButtonClass = (section) =>
        "sidebar-button" +
        (activeSection === section ? " sidebar-button-active" : "");


    // --- ANA RENDER ---
    return (
        <div className="app-layout">
            {/* Modal bileşenleri */}
            {renderAppointmentDetailModal()}
            {renderQuickPatientInfoModal()}

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

                        {/* ÇALIŞMA TAKVİMİ */}
                        <button
                            className={sectionButtonClass("calendar")}
                            onClick={() => setActiveSection("calendar")}
                            style={{ marginTop: "8px" }}
                        >
                            Çalışma Takvimi
                        </button>

                        {/* YENİ: İZİN YÖNETİMİ */}
                        <button
                            className={sectionButtonClass("leave")}
                            onClick={() => setActiveSection("leave")}
                            style={{ marginTop: "8px" }}
                        >
                            İzin Yönetimi
                        </button>

                        {/* HASTA SORGULA */}
                        <button
                            className={sectionButtonClass("search")}
                            onClick={() => setActiveSection("search")}
                            style={{ marginTop: "8px" }}
                        >
                            Hasta Sorgula
                        </button>

                        {/* YENİ: PROFİL AYARLARI - GÖRÜNTÜLEME MODUNDA BAŞLAT */}
                        <button
                            className={sectionButtonClass("profile")}
                            onClick={() => { setActiveSection("profile"); setIsEditingProfile(false); }}
                            style={{ marginTop: "8px" }}
                        >
                            Profil/Hesap Ayarları
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
                {/* --- HASTA SORGULA --- */}
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
                                                <td>
                                                    <a
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleQuickPatientInfoClick(a.tc_no, a.patientName);
                                                        }}
                                                        style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
                                                        title="Hasta detaylarını hızla gör"
                                                    >
                                                        {a.patientName}
                                                    </a>
                                                </td>
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

                {/* --- DOKTOR PANELİ: ÇALIŞMA TAKVİMİ --- */}
                {activeSection === "calendar" && (
                    renderWorkCalendar()
                )}

                 {/* --- YENİ: İZİN YÖNETİMİ --- */}
                {activeSection === "leave" && (
                    renderLeaveManagement()
                )}

                {/* --- YENİ: PROFİL AYARLARI --- */}
                {activeSection === "profile" && (
                    renderProfileManagement()
                )}

            </main>
        </div>
    );
}