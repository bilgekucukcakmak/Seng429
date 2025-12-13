// src/pages/PatientPage.jsx (NİHAİ VE TAM HALİ)

import { useState, useEffect, useMemo } from "react";
import "../styles/layout.css";
import React from 'react';

import {
    getAllDoctors,
    getPatientAppointments,
    createAppointment,
    getPatientProfile,
    updatePatientProfile,
} from "../services/api";

// Helper: Tarihi YYYY-MM-DD formatına çevirir
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
};

// Helper: Bugünün tarihini YYYY-MM-DD formatında döner (Min kısıtlaması için)
const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};

// HELPER: 15 dakikalık aralıklarla saat dilimleri üretir (09:00 - 16:45, 12:00-13:00 arası hariç)
const generateTimeSlots = () => {
    const slots = [];
    const interval = 15;

    for (let h = 9; h <= 16; h++) {
        for (let m = 0; m < 60; m += interval) {

            if (h === 16 && m > 45) {
                continue;
            }

            if (h === 12) {
                continue;
            }

            const hourString = h.toString().padStart(2, '0');
            const minuteString = m.toString().padStart(2, '0');
            const timeSlot = `${hourString}:${minuteString}`;
            slots.push(timeSlot);
        }
    }

    // 16:45'i kontrol et
    if (!slots.includes('16:45')) {
         slots.push('16:45');
    }

    return slots;
};

const AVAILABLE_TIME_SLOTS = generateTimeSlots();


export default function PatientPage({ user, onLogout }) {
    const [activeSection, setActiveSection] = useState("profile");
    const [loading, setLoading] = useState(true);
    const userId = user.userId;

    // === PROFİL STATE ==========================================================
    const [profile, setProfile] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    // === RANDEVU STATE'LERİ ===================================================
    const [allDoctors, setAllDoctors] = useState([]);
    const [selectedSpecialization, setSelectedSpecialization] = useState("");
    const [myAppointments, setMyAppointments] = useState([]);
    const [pastAppointments, setPastAppointments] = useState([]);
    const [appointment, setAppointment] = useState({
        doctorId: "",
        date: "",
        time: "",
        reason: "",
    });
    const [appointmentMessage, setAppointmentMessage] = useState({ type: '', text: '' });


    // --- YARDIMCI FİLTRELER ---
    const specializations = useMemo(() => {
        const specs = [...new Set(allDoctors.map(d => d.specialization))];
        return specs.filter(s => s != null && s !== '');
    }, [allDoctors]);

    const filteredDoctors = useMemo(() => {
        if (!selectedSpecialization) return [];
        return allDoctors.filter(d => d.specialization === selectedSpecialization);
    }, [allDoctors, selectedSpecialization]);


    // --- PROFIL VERİSİNİ ÇEKME ---
    const fetchProfile = async () => {
        try {
            const response = await getPatientProfile();
            setProfile(response.data);
            setEditData(response.data);
            setProfileMessage({ type: 'success', text: '' });
        } catch (error) {
            console.error("Profil çekme hatası:", error);
            setProfileMessage({ type: 'error', text: 'Profil verisi yüklenemedi.' });
        }
    };

    // --- PROFIL GÜNCELLEME İŞLEMLERİ ---
    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setProfileMessage({ type: '', text: '' });
        try {
            await updatePatientProfile(editData);
            setProfileMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
            fetchProfile();
            setIsEditing(false);
        } catch (error) {
            setProfileMessage({ type: 'error', text: 'Güncelleme başarısız oldu: ' + (error.response?.data || 'Sunucu hatası.') });
        }
    };

    const handleCancel = () => {
        setEditData(profile);
        setIsEditing(false);
    };

    // --- RANDEVU İŞLEMLERİ ---
    const fetchAppointments = async () => {
        try {
            const appointmentsResponse = await getPatientAppointments(userId);
            const appointmentsData = appointmentsResponse.data;

            const now = new Date();

            const upcoming = appointmentsData.filter(a => {
                // KRİTİK DÜZELTME: Tarihi yerel saate göre kontrol et
                const appointmentTime = new Date(a.appointment_date.replace(' ', 'T'));

                return appointmentTime.getTime() >= now.getTime() && a.status === 'scheduled';
            });

            const past = appointmentsData.filter(a => {
                const appointmentTime = new Date(a.appointment_date.replace(' ', 'T'));
                return appointmentTime.getTime() < now.getTime() || a.status !== 'scheduled';
            });


            setMyAppointments(upcoming);
            setPastAppointments(past);

        } catch (error) {
             console.error("Randevuları çekme hatası:", error);
        }
    };

    const handleAppointmentChange = (e) => {
        setAppointment({ ...appointment, [e.target.name]: e.target.value });
    };

    const handleSpecializationChange = (e) => {
        setSelectedSpecialization(e.target.value);
        setAppointment(prev => ({ ...prev, doctorId: "", date: "", time: "" }));
    };

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        setAppointmentMessage({ type: '', text: '' });

        if (!selectedSpecialization || !appointment.doctorId || !appointment.date || !appointment.time) {
            setAppointmentMessage({ type: 'error', text: "Lütfen poliklinik dahil tüm zorunlu alanları doldurun." });
            return;
        }

        // HAFTA SONU KONTROLÜ
        const selectedDate = new Date(appointment.date + 'T00:00:00');
        const dayOfWeek = selectedDate.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            setAppointmentMessage({ type: 'error', text: "Hafta sonları (Cumartesi/Pazar) randevu alınamamaktadır." });
            return;
        }

        try {
            const appointment_date = `${appointment.date} ${appointment.time}:00`;

            const payload = {
                doctorId: parseInt(appointment.doctorId),
                appointmentDate: appointment_date,
                reason: appointment.reason,
            };

            await createAppointment(payload);
            setAppointmentMessage({ type: 'success', text: "Randevunuz başarıyla oluşturuldu! Listenizi yenilemek için bekleyin..." });

            setTimeout(() => {
                fetchAppointments();
            }, 150);

            setAppointment({ doctorId: "", date: "", time: "", reason: "" });
            setSelectedSpecialization("");

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Randevu oluşturulurken sunucu hatası oluştu.";
            setAppointmentMessage({ type: 'error', text: errorMessage });
            console.error("Randevu oluşturma hatası:", error);
        }
    };


    // --- useEffect: Başlangıç Verilerini Çekme ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                await Promise.all([fetchProfile(), fetchAppointments()]);

                const doctorsResponse = await getAllDoctors();
                setAllDoctors(doctorsResponse.data);

            } catch (error) {
                console.error("Veri çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);


    if (loading) {
        return <div className="app-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <h2 style={{ color: '#F2C94C' }}>Veriler Yükleniyor...</h2>
        </div>;
    }


    // --- RENDER FONKSİYONLARI ---

    function renderProfile() {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

        return (
            <div className="card">
                <div className="profile-header">
                    <div className="profile-main">
                        <div className="profile-avatar">{fullName.charAt(0)}</div>
                        <div className="profile-name-block">
                            <span className="profile-name">{fullName || user.email}</span>
                            <span className="profile-meta">TC: {profile.tc_no || "Bilinmiyor"}</span>
                            <span className="profile-meta">Rol: Hasta</span>
                        </div>
                    </div>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="profile-edit-button">
                            Düzenle
                        </button>
                    )}
                </div>

                {profileMessage.text && (
                    <p style={{ color: profileMessage.type === 'error' ? 'red' : 'green', fontWeight: 'bold' }}>
                        {profileMessage.text}
                    </p>
                )}

                {!isEditing ? (
                    <div className="profile-grid">
                        <div className="profile-label">Doğum Tarihi</div>
                        <div className="profile-value">{profile.date_of_birth ? formatDate(profile.date_of_birth) : "Bilinmiyor"}</div>
                        <div className="profile-label">Kan Grubu</div>
                        <div className="profile-value">{profile.blood_type || "Bilinmiyor"}</div>

                        <div className="profile-label">Cinsiyet</div>
                        <div className="profile-value">{profile.gender || "Bilinmiyor"}</div>
                        <div className="profile-label">Telefon No</div>
                        <div className="profile-value">{profile.phone_number || "Bilinmiyor"}</div>

                        <div className="profile-label">Boy (cm)</div>
                        <div className="profile-value">{profile.height || "Bilinmiyor"}</div>
                        <div className="profile-label">Kilo (kg)</div>
                        <div className="profile-value">{profile.weight || "Bilinmiyor"}</div>
                        <div className="profile-label">Alerjiler</div>
                        <div className="profile-value">{profile.allergies || "Yok"}</div>
                        <div className="profile-label">Mevcut Hastalıklar</div>
                        <div className="profile-value">{profile.diseases || "Yok"}</div>
                    </div>
                ) : (
                    <div style={{ marginTop: "8px" }}>
                        <div className="form-field">
                            <label>TC Kimlik No</label>
                            <input className="form-input" name="tc_no" value={editData.tc_no || ''} onChange={handleEditChange} />
                        </div>
                        <div className="form-field">
                            <label>Doğum Tarihi</label>
                            <input type="date" className="form-input" name="date_of_birth"
                                value={formatDate(editData.date_of_birth)}
                                onChange={handleEditChange} />
                        </div>
                        <div className="form-field">
                            <label>Kan Grubu</label>
                            <input className="form-input" name="blood_type" value={editData.blood_type || ''} onChange={handleEditChange} />
                        </div>

                        <div className="form-field">
                             <label htmlFor="gender">Cinsiyet</label>
                             <select
                                id="gender"
                                className="form-input"
                                name="gender"
                                value={editData.gender || ''}
                                onChange={handleEditChange}
                            >
                                <option value="">Seçiniz</option>
                                <option value="Erkek">Erkek</option>
                                <option value="Kadın">Kadın</option>
                                <option value="Bilinmiyor">Bilinmiyor</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Telefon No</label>
                            <input className="form-input" name="phone_number" value={editData.phone_number || ''} onChange={handleEditChange} />
                        </div>

                        <div className="form-field">
                            <label>Boy (cm)</label>
                            <input type="number" className="form-input" name="height" value={editData.height || ''} onChange={handleEditChange} />
                        </div>
                        <div className="form-field">
                            <label>Kilo (kg)</label>
                            <input type="number" className="form-input" name="weight" value={editData.weight || ''} onChange={handleEditChange} />
                        </div>
                        <div className="form-field">
                            <label>Alerjiler</label>
                            <input className="form-input" name="allergies" value={editData.allergies || ''} onChange={handleEditChange} />
                        </div>
                        <div className="form-field">
                            <label>Mevcut Hastalıklar</label>
                            <input className="form-input" name="diseases" value={editData.diseases || ''} onChange={handleEditChange} />
                        </div>
                        <div className="profile-form-actions">
                            <button className="appointment-submit" style={{ flex: 1 }} onClick={handleSave}>
                                Kaydet
                            </button>
                            <button className="modal-button modal-cancel" style={{ flex: 1 }} onClick={handleCancel}>
                                İptal
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    function renderCreateAppointment() {
        return (
             <div className="card">
                <h2>Randevu Oluştur</h2>

                {appointmentMessage.text && (
                    <p style={{ color: appointmentMessage.type === 'error' ? 'red' : 'green', fontWeight: 'bold' }}>
                        {appointmentMessage.text}
                    </p>
                )}

                <form className="appointment-form" onSubmit={handleAppointmentSubmit}>

                    <div className="form-field">
                        <label>Poliklinik Seçin</label>
                        <select
                            className="form-input"
                            name="specialization"
                            value={selectedSpecialization}
                            onChange={handleSpecializationChange}
                            required
                        >
                            <option value="">— Poliklinik Seçin —</option>
                            {specializations.map((spec) => (
                                <option key={spec} value={spec}>
                                    {spec}
                                </option>
                            ))}
                        </select>
                    </div>


                    <div className="form-field">
                        <label>Doktor Seçin ({filteredDoctors.length} doktor mevcut)</label>
                        <select
                            className="form-input"
                            name="doctorId"
                            value={appointment.doctorId}
                            onChange={handleAppointmentChange}
                            required
                            disabled={!selectedSpecialization}
                        >
                            <option value="">
                                {selectedSpecialization ? '— Doktor Seçin —' : 'Önce Poliklinik Seçin'}
                            </option>
                            {filteredDoctors.map((doctor) => (
                                <option key={doctor.doctor_id} value={doctor.doctor_id}>
                                    Dr. {doctor.first_name} {doctor.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label>Tarih (Hafta sonu randevu alınamaz)</label>
                            <input
                                type="date"
                                className="form-input"
                                name="date"
                                value={appointment.date}
                                onChange={handleAppointmentChange}
                                required
                                min={getTodayDate()}
                            />
                        </div>

                        <div className="form-field">
                            <label>Saat (09:00 - 16:45 arası, 12:00-13:00 arası hariç)</label>
                            <select
                                className="form-input"
                                name="time"
                                value={appointment.time}
                                onChange={handleAppointmentChange}
                                required
                                disabled={!appointment.date}
                            >
                                <option value="">— Saat Seçin —</option>
                                {AVAILABLE_TIME_SLOTS.map(time => (
                                    <option key={time} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Neden</label>
                        <input
                            className="form-input"
                            name="reason"
                            placeholder="Örn: Baş ağrısı, kontrol, tahlil sonucu vb."
                            value={appointment.reason}
                            onChange={handleAppointmentChange}
                        />
                    </div>

                    <button type="submit" className="appointment-submit" disabled={!appointment.doctorId || !appointment.date || !appointment.time}>
                        Randevu Oluştur
                    </button>
                </form>
            </div>
        );
    }

    function renderAppointmentsList(appointments) {
        if (appointments.length === 0) {
            return <p>{activeSection === 'list' ? 'Yaklaşan randevunuz bulunmamaktadır.' : 'Kayıtlı geçmiş randevunuz bulunmamaktadır.'}</p>;
        }

        const getStatusText = (status) => {
            if (status === 'scheduled') return 'Planlandı';
            if (status === 'completed') return 'Tamamlandı';
            if (status === 'canceled') return 'İptal Edildi';
            return 'Bilinmiyor';
        };

        const getStatusClass = (status) => {
            if (status === 'scheduled') return 'status-badge status-bekliyor';
            if (status === 'completed') return 'status-badge status-muayene';
            if (status === 'canceled') return 'status-badge status-gelmedi';
            return 'status-badge';
        };

        return (
            <table className="patient-appointments-table" style={{ marginTop: "10px" }}>
                <thead>
                    <tr>
                        <th>Doktor</th>
                        <th>Uzmanlık</th>
                        <th>Tarih</th>
                        <th>Saat</th>
                        <th>Durum</th>
                        {activeSection === 'history' && <th>Not</th>}
                    </tr>
                </thead>
                <tbody>
                    {appointments.map((a) => (
                        <tr key={a.id}>
                            <td>Dr. {a.doctor_first_name} {a.doctor_last_name}</td>
                            <td>{a.specialization}</td>
                            <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                            <td>{new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td>
                                <span className={getStatusClass(a.status)}>
                                    {getStatusText(a.status)}
                                </span>
                            </td>
                            {activeSection === 'history' && <td>{a.doctor_note || 'Yok'}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }


    // --- ANA RENDER ---
    return (
        <div className="app-layout">
            {/* =============== SIDEBAR =============== */}
            <aside className="app-sidebar">
                <div>
                    <h2 className="app-sidebar-title">Cankaya Hospital</h2>
                    <p className="app-sidebar-subtitle">
                        @{user?.email || "patient"} · patient
                    </p>

                    <div className="sidebar-buttons">
                        <button
                            className={"sidebar-button" + (activeSection === "profile" ? " sidebar-button-active" : "")}
                            onClick={() => setActiveSection("profile")}
                        >
                            Profil
                        </button>

                        <button
                            className={"sidebar-button" + (activeSection === "create" ? " sidebar-button-active" : "")}
                            onClick={() => setActiveSection("create")}
                        >
                            Randevu Oluştur
                        </button>

                        <button
                            className={"sidebar-button" + (activeSection === "list" ? " sidebar-button-active" : "")}
                            onClick={() => setActiveSection("list")}
                        >
                            Yaklaşan Randevularım
                        </button>

                        <button
                            className={"sidebar-button" + (activeSection === "history" ? " sidebar-button-active" : "")}
                            onClick={() => setActiveSection("history")}
                        >
                            Geçmiş Randevularım
                        </button>
                    </div>
                </div>
                <button onClick={onLogout} className="logout-button">
                    Çıkış
                </button>
            </aside>

            {/* =============== ANA İÇERİK =============== */}
            <main className="app-main">
                {activeSection === "profile" && renderProfile()}
                {activeSection === "create" && renderCreateAppointment()}
                {activeSection === "list" && (
                    <div className="card">
                        <h2>Yaklaşan Randevularım</h2>
                        {renderAppointmentsList(myAppointments)}
                    </div>
                )}
                {activeSection === "history" && (
                     <div className="card">
                        <h2>Geçmiş Randevularım</h2>
                        {renderAppointmentsList(pastAppointments)}
                    </div>
                )}
            </main>
        </div>
    );
}