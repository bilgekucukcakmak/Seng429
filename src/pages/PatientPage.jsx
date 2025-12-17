// src/pages/PatientPage.jsx (NİHAİ VE TAM HALİ - İptal ve Saat Düzeltmeleri Uygulandı)

import { useState, useEffect, useMemo } from "react";
import "../styles/layout.css";
import React from 'react';
import { initializeAuthToken } from "../services/api";

import {
    getAllDoctors,
    getPatientAppointments,
    createAppointment,
    getPatientProfile,
    updatePatientProfile,
    getAvailableSlots,
    updateAppointmentStatus, // Randevu durumunu güncellemek için import edildi
} from "../services/api";

// Helper: Tarihi YYYY-MM-DD formatına çevirir
const formatDate = (dateString) => {
    if (!dateString) return '';
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
        date = new Date(dateString + 'T00:00:00');
    }
    return date.toISOString().split('T')[0];
};

// Helper: Bugünün tarihini YYYY-MM-DD formatında döner (Min kısıtlaması için)
const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};

export default function PatientPage({ user, onLogout }) {
    const [activeSection, setActiveSection] = useState("profile");
    const [loading, setLoading] = useState(true);
    const userId = user.userId;

    // === PROFİL STATE ==========================================================
    const [profile, setProfile] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    // HATA DÜZELTİLDİ: useState({}) olarak tanımlanmalıydı
    const [editData, setEditData] = useState({});

    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    // === RANDEVU STATE'LERİ ===================================================
    const [allDoctors, setAllDoctors] = useState([]);
    const [selectedSpecialization, setSelectedSpecialization] = useState("");

    // YENİ/BİRLEŞİK RANDEVU LİSTESİ
    const [allAppointments, setAllAppointments] = useState([]);

    const [appointment, setAppointment] = useState({
        doctorId: "",
        date: "",
        time: "",
        reason: "",
        appointmentType: "Muayene",
        policlinic: "",
    });
    const [appointmentMessage, setAppointmentMessage] = useState({ type: '', text: '' });

    // === YENİ SLOT YÖNETİMİ STATE'LERİ ===================================
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotLoading, setSlotLoading] = useState(false);
    // =========================================================================


    // --- YARDIMCI FİLTRELER ---
    const specializations = useMemo(() => {
        const specs = [...new Set(allDoctors.map(d => d.specialization))];
        return specs.filter(s => s != null && s !== '');
    }, [allDoctors]);

    const filteredDoctors = useMemo(() => {
        if (!selectedSpecialization) return [];
        return allDoctors.filter(d => d.specialization === selectedSpecialization);
    }, [allDoctors, selectedSpecialization]);


    // --- SLOTLARI ÇEKME FONKSİYONU ---
    const fetchSlots = async (doctorId, date) => {
        if (!doctorId || !date) {
            setAvailableSlots([]);
            return;
        }

        const dateShort = formatDate(date);
        setSlotLoading(true);
        setAppointmentMessage({ type: '', text: '' });

        const selectedDateObj = new Date(dateShort + 'T00:00:00');
        const dayOfWeek = selectedDateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
             setAvailableSlots([]);
             setSlotLoading(false);
             setAppointmentMessage({ type: 'error', text: "Hafta sonları (Cumartesi/Pazar) randevu alınamamaktadır." });
             return;
        }

        try {
            const response = await getAvailableSlots(doctorId, dateShort);
            setAvailableSlots(response.data);

            const selectedSlotExists = response.data.some(slot => slot.time === appointment.time && slot.status === 'available');
            if (!selectedSlotExists) {
                setAppointment(prev => ({ ...prev, time: "" }));
            }

        } catch (error) {
            console.error("Slotlar çekilemedi:", error);
            const msg = error.response?.data?.message || "Saat slotları yüklenirken bir hata oluştu.";
            setAppointmentMessage({ type: 'error', text: msg });
            setAvailableSlots([]);
        } finally {
            setSlotLoading(false);
        }
    };


    // --- useEffect: Slotları Çekme ---
    useEffect(() => {
        if (appointment.doctorId && appointment.date) {
            fetchSlots(appointment.doctorId, appointment.date);
        } else {
             setAvailableSlots([]);
        }
    }, [appointment.doctorId, appointment.date]);


   const fetchProfile = async () => {
       try {
           const response = await getPatientProfile();
           console.log("Profile fetched:", response.data); // <= Buraya bak
           setProfile(response.data);
           setEditData(response.data);
       } catch (error) {
           console.error("Profil çekme hatası:", error);
       }
   };


    // --- PROFIL GÜNCELLEME İŞLEMLERİ ---
    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };


  const handleSave = async () => {
      initializeAuthToken(); // Token'ı tazele

      try {
          // Düzenleme yaptığınız state 'editData' ise onu gönderin
          await updatePatientProfile(editData);

          alert("Profil başarıyla güncellendi.");
          setIsEditing(false); // Düzenleme modunu kapat

          // KRİTİK: Bilgilerin "Bilinmiyor"dan gerçek verilere dönüşmesi için burayı çağırın
          await fetchProfile();

      } catch (error) {
          console.error("Profil güncellenirken hata oluştu:", error);
          alert("Kaydetme başarısız: " + (error.response?.data?.message || "Sunucu hatası"));
      }
  };

    const handleCancel = () => {
        setEditData(profile);
        setIsEditing(false);
    };


   // --- RANDEVU LİSTELEME İŞLEMLERİ (Saat Parsing Düzeltildi) ---
   const fetchAppointments = async () => {
     try {
         const appointmentsResponse = await getPatientAppointments();
         const appointmentsData = appointmentsResponse.data;

         const now = new Date();

         const processedAppointments = appointmentsData.map(a => {
             // DÜZELTME: 'Z' (UTC) etiketi kaldırıldı, yerel saati kullanması sağlandı.
             // Bu, 00:00 sorununun çözülmesine yardımcı olacaktır.
             const appointmentDateTime = new Date(`${a.appointment_date.split('T')[0]}T${a.time}:00`);

             // Randevunun geçmiş mi (saat geçtiyse VEYA durumu scheduled değilse) olduğunu belirle
             const isPast = appointmentDateTime.getTime() < now.getTime() || a.status !== 'scheduled';

             return {
                 ...a,
                 isPast: isPast,
             };
         });

         setAllAppointments(processedAppointments);

     } catch (error) {
          console.error("Randevuları çekme hatası (API ÇAĞRISI BAŞARISIZ):", error);
     }
 };

    // --- RANDEVU İPTAL İŞLEMİ (API Çağrısı Düzeltildi) ---
    const handleCancelAppointment = async (appointmentId) => {
        if (!window.confirm("Bu randevuyu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
            return;
        }

        try {
            // 1. Randevuyu backend'de 'canceled' olarak güncelle
            await updateAppointmentStatus(appointmentId, 'canceled', 'Hasta tarafından iptal edildi.');

            alert("Randevu başarıyla iptal edildi.");

            // 2. Güncel verileri çekmek için listeyi yenile
            await fetchAppointments();

        } catch (error) {
            console.error("Randevu iptal hatası:", error);
            alert("Randevu iptal edilirken bir hata oluştu. Liste yenileniyor.");
            await fetchAppointments(); // Hata durumunda da listeyi yenile
        }
    };


const handleAppointmentChange = (e) => {
    const { name, value } = e.target;

    if (name === "date") {
        const selectedDate = new Date(value);
        const day = selectedDate.getDay(); // 0 = Pazar, 6 = Cumartesi

        if (day === 0 || day === 6) {
            alert("Hafta sonu randevu alınamaz. Lütfen bir iş günü seçiniz.");
            setAppointment(prev => ({ ...prev, date: "" }));
            return;
        }
    }

    setAppointment(prev => ({
        ...prev,
        [name]: value
    }));
};

    const handleSpecializationChange = (e) => {
        setSelectedSpecialization(e.target.value);
        setAppointment(prev => ({ ...prev, doctorId: "", date: "", time: "" }));
        setAppointmentMessage({ type: '', text: '' });
    };

    const handleTimeSelect = (timeSlot) => {
        setAppointment(prev => ({ ...prev, time: timeSlot }));
        setAppointmentMessage({ type: '', text: '' });
    };

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        setAppointmentMessage({ type: '', text: '' });

        if (!selectedSpecialization || !appointment.doctorId || !appointment.date || !appointment.time || !appointment.reason) {
            setAppointmentMessage({ type: 'error', text: "Lütfen tüm zorunlu alanları (saat dahil) doldurun." });
            return;
        }

        try {
            const payload = {
                doctorId: parseInt(appointment.doctorId),
                appointmentDate: appointment.date,
                time: appointment.time,
                reason: appointment.reason,
                appointmentType: appointment.appointmentType,
            };

            await createAppointment(payload);
            setAppointmentMessage({ type: 'success', text: "Randevunuz başarıyla oluşturuldu! Listenizi yenilemek için bekleyin..." });

            setTimeout(() => {
                fetchAppointments();
            }, 150);

           setAppointment({ doctorId: "", date: "", time: "", reason: "", appointmentType: "Muayene" });
            setSelectedSpecialization("");

        } catch (error) {
            const errorMessage = error.response?.data || error.message || "Randevu oluşturulurken sunucu hatası oluştu.";
            setAppointmentMessage({ type: 'error', text: errorMessage });
            console.error("Randevu oluşturma hatası:", error);
        }
    };


    // --- useEffect: Başlangıç Verilerini Çekme ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Hata düzeltmesi sonrası setEditData(response.data) çağrısının doğru çalışması için
                await fetchProfile();

                const appointmentsPromise = fetchAppointments();

                const doctorsResponse = await getAllDoctors();
                setAllDoctors(doctorsResponse.data);

                await appointmentsPromise;


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
                            <button
                                className="appointment-submit"
                                style={{
                                    flex: 1,
                                    backgroundColor: '#ffc107', // Sarı renk
                                    color: '#333',              // Yazı rengi
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '10px 20px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                                onClick={handleSave}
                            >
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
        const isDoctorAndDateSelected = appointment.doctorId && appointment.date;

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
                                disabled={!appointment.doctorId}
                                style={{ maxWidth: '300px' }}
                            />
                        </div>

                         {/* SAAT SEÇİMİ BÖLÜMÜ */}
                        <div className="form-field full-width" style={{ marginTop: '15px' }}>
                            <label>Saat Seçin (30 dakikalık slotlar)</label>

                            {slotLoading ? (
                                <p>Müsait saatler yükleniyor...</p>
                            ) : !isDoctorAndDateSelected ? (
                                <p style={{color: '#999', marginTop: '5px'}}>Lütfen doktor ve tarih seçin.</p>
                            ) : availableSlots.length === 0 ? (
                                <p style={{color: 'red'}}>Seçilen tarihte müsait slot bulunamadı veya doktor izinli.</p>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                                    {availableSlots.map((slot) => (
                                        <button
                                            key={slot.time}
                                            type="button"
                                            className={`slot-button
                                                        ${slot.status === 'available' ? 'slot-available' : 'slot-unavailable'}
                                                        ${appointment.time === slot.time ? 'slot-selected' : ''}`}
                                            onClick={() => {
                                                if (slot.status === 'available') {
                                                    handleTimeSelect(slot.time);
                                                }
                                            }}
                                            disabled={slot.status !== 'available'}
                                        >
                                            {slot.time}
                                            {/* Durumu butona küçük bir etiketle ekleyebiliriz */}
                                            {slot.status !== 'available' &&
                                                <span style={{ fontSize: '10px', display: 'block' }}>
                                                    ({slot.status === 'leave' ? 'İzin' : slot.status === 'booked' ? 'Dolu' : 'Geçmiş'})
                                                </span>
                                            }
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
<div className="form-field">
                        <label>Randevu Tipi</label>
                        <select
                            className="form-input"
                            name="appointmentType"
                            value={appointment.appointmentType}
                            onChange={handleAppointmentChange}
                            required
                        >
                            <option value="Muayene">Muayene</option>
                            <option value="Sonuç">Sonuç/Rapor Gösterme</option>
                        </select>
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
<div className="appointment-warning" style={{ color: 'red', fontWeight: 'bold', marginBottom: '10px' }}>
    Randevu saatinden en geç 15 dakika önce orada olmalısınız!
</div>

                    <button
                        type="submit"
                        className="appointment-submit"
                        disabled={!appointment.doctorId || !appointment.date || !appointment.time || !appointment.reason}
                        style={{
                            backgroundColor: '#ffc107', // Sarı renk
                            color: '#333',              // Yazı rengi
                            border: 'none',
                            borderRadius: '4px',
                            padding: '10px 20px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Randevu Oluştur
                    </button>
                </form>
            </div>
        );
    }

    // --- YENİ BİRLEŞİK RANDEVU LİSTESİ RENDER FONKSİYONU ---
    function renderAppointmentsList() {
        if (allAppointments.length === 0) {
            return <p>Kayıtlı randevunuz bulunmamaktadır.</p>;
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
                        <th>Durum</th>
                        <th>Doktor</th>
                        <th>Uzmanlık</th>
                        <th>Tarih</th>
                        <th>Saat</th>
                        <th>İşlem Durumu</th>
                        <th>Neden/Not</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    {allAppointments.map((a) => (
                        <tr
                            key={a.id}
                            style={{
                                // Renk Kodlaması: Yeşil (Yaklaşan) / Gri (Geçmiş)
                                backgroundColor: a.isPast ? '#f8f8f8' : '#e6ffe6',
                                opacity: a.isPast ? 0.9 : 1,
                                borderLeft: `5px solid ${a.isPast ? '#adb5bd' : '#28a745'}` // Kenarlık Rengi
                            }}
                        >
                             <td style={{ fontWeight: 'bold', color: a.isPast ? '#6c757d' : '#28a745' }}>
                                {a.isPast ? 'Geçmiş' : 'Yaklaşan'}
                            </td>
                            <td>Dr. {a.doctor_first_name} {a.doctor_last_name}</td>
                            <td>{a.specialization}</td>
                            <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                            <td>{a.time}</td>
                            <td>
                                <span className={getStatusClass(a.status)}>
                                    {getStatusText(a.status)}
                                </span>
                            </td>
                            <td>{a.reason || a.doctor_note || '-'}</td>

                            {/* İPTAL BUTONU SÜTUNU */}
                            <td>
                                {!a.isPast && a.status === 'scheduled' ? (
                                    <button
                                        className="chip-button chip-danger"
                                        style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                        onClick={() => handleCancelAppointment(a.id)}
                                    >
                                        İptal Et
                                    </button>
                                ) : (
                                    <span style={{ color: '#6c757d', fontSize: '12px' }}>
                                        —
                                    </span>
                                )}
                            </td>
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

                                {/* KULLANICI BİLGİ BLOĞU */}
                                {profile.first_name && profile.last_name ? (
                                    <div className="sidebar-user-block" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                        <div className="sidebar-avatar" style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: '#f2c94c',
                                            color: '#000',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            textTransform: 'uppercase'
                                        }}>
                                             {`${profile.first_name?.charAt(0) || ''}${profile.last_name?.charAt(0) || ''}`}
                                                </div>
                                                <span>{profile.first_name} {profile.last_name}</span>
                                            </div>
                                ) : (
                                    <p className="app-sidebar-subtitle">
                                        @{user?.email || "patient"} · patient
                                    </p>
                                )}

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

                        {/* TEK RANDEVU LİSTESİ BUTONU */}
                        <button
                            className={"sidebar-button" + (activeSection === "appointments" ? " sidebar-button-active" : "")}
                            onClick={() => setActiveSection("appointments")}
                        >
                            Tüm Randevularım
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

                   {activeSection === "appointments" && (
                                    <div className="card">
                                        <h2>Tüm Randevularım</h2>
                                        {renderAppointmentsList()}
                                    </div>
                                )}
                            </main>
                        </div>
                    ); // Bu parantez PatientPage fonksiyonunu kapatır.
                }