import { useState, useEffect, useMemo } from "react";
import "../styles/layout.css";
import React from 'react';
import { jsPDF } from "jspdf";
// 'api'yi default import olarak alıp ismini 'apiService' yapıyoruz
import apiService, {
    initializeAuthToken,
    getAllDoctors,
    getPatientAppointments,
    createAppointment,
    getPatientProfile,
    updatePatientProfile,
    getAvailableSlots,
    updateAppointmentStatus,
    getSpecializations
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
const downloadPrescriptionPDF = (p) => {
    const doc = new jsPDF();

    // Güvenli metin dönüştürücü (Karakter kaymalarını engeller)
    const s = (text) => {
        if (!text) return "---";
        return text.toString()
            .replace(/İ/g, 'I').replace(/ı/g, 'i')
            .replace(/Ş/g, 'S').replace(/ş/g, 's')
            .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
            .replace(/Ü/g, 'U').replace(/ü/g, 'u')
            .replace(/Ö/g, 'O').replace(/ö/g, 'o')
            .replace(/Ç/g, 'C').replace(/ç/g, 'c');
    };

    // --- Tasarım: Sarı Üst Şerit ---
    doc.setFillColor(242, 201, 76);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("CANKAYA HOSPITAL", 105, 17, { align: "center" });

    // --- Reçete Bilgileri ---
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`E-RECETE NO: #REC-${p.id + 5000}`, 20, 35);
    doc.text(`Tarih: ${new Date(p.appointment_date).toLocaleDateString()}`, 190, 35, { align: "right" });
    doc.setDrawColor(242, 201, 76);
    doc.line(20, 38, 190, 38);

    // --- Hasta & Doktor Bilgileri (Backend İsimleriyle Birebir Eşleşti) ---
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // HASTA BİLGİLERİ (Sol)
    doc.setFont("helvetica", "bold");
    doc.text("HASTA BILGILERI", 20, 50);
    doc.setFont("helvetica", "normal");
    // Backend'deki AS patient_first_name ve AS patient_tc kullanılıyor
    const fullPatientName = `${p.patient_first_name || ''} ${p.patient_last_name || ''}`;
    doc.text(`Ad Soyad: ${s(fullPatientName)}`, 20, 57);
    doc.text(`TC Kimlik: ${p.patient_tc || "-----------"}`, 20, 64);

    // DOKTOR BİLGİLERİ (Sağ)
    doc.setFont("helvetica", "bold");
    doc.text("DOKTOR BILGILERI", 120, 50);
    doc.setFont("helvetica", "normal");
    const dFull = `${p.doctor_title || ''} ${p.doctor_first_name || ''} ${p.doctor_last_name || ''}`;
    doc.text(s(dFull), 120, 57);
    doc.text(`Birim: ${s(p.specialization || "Poliklinik")}`, 120, 64);

    // --- Yeşil Başlık (Hizalama Düzeltildi) ---
    doc.setFillColor(245, 255, 250);
    doc.rect(20, 78, 170, 12, 'F');
    doc.setFont("helvetica", "bold");
    doc.setTextColor(39, 174, 96);
    doc.text(s("RECETE ICERIGI VE KULLANIM TALIMATLARI"), 105, 86, { align: "center" });

    // --- İlaç Listesi ---
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    doc.setFont("helvetica", "normal");
    const meds = p.prescription ? p.prescription.split(", ") : [];
    let yPos = 105;

    meds.forEach((med, index) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}.`, 22, yPos);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(s(med), 155);
        doc.text(lines, 30, yPos);
        yPos += (lines.length * 10);
    });

    // --- Alt Bilgi ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(s("Bu belge e-imzalidir. Gecerlilik suresi 4 is gunudur. Gecmis olsun."), 105, 285, { align: "center" });

    doc.save(`Recete_${p.id}.pdf`);
};

const downloadTestResultsPDF = (p) => {
    const doc = new jsPDF();

    // Güvenli metin dönüştürücü (Türkçe karakter desteği için)
    const s = (text) => {
        if (!text) return "---";
        return text.toString()
            .replace(/İ/g, 'I').replace(/ı/g, 'i')
            .replace(/Ş/g, 'S').replace(/ş/g, 's')
            .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
            .replace(/Ü/g, 'U').replace(/ü/g, 'u')
            .replace(/Ö/g, 'O').replace(/ö/g, 'o')
            .replace(/Ç/g, 'C').replace(/ç/g, 'c');
    };

    // --- Kurumsal Üst Bilgi ---
    doc.setFillColor(44, 62, 80); // Koyu Lacivert (Laboratuvar için daha ciddi bir ton)
    doc.rect(0, 0, 210, 25, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("CANKAYA HOSPITAL - LABORATUVAR", 105, 17, { align: "center" });

    // --- Rapor Bilgileri ---
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`RAPOR NO: #LAB-${p.id + 7000}`, 20, 35);
    doc.text(`Onay Tarihi: ${new Date(p.appointment_date).toLocaleDateString('tr-TR')}`, 190, 35, { align: "right" });
    doc.setDrawColor(44, 62, 80);
    doc.line(20, 38, 190, 38);

    // --- Hasta & Doktor Bilgileri ---
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("HASTA BILGILERI", 20, 48);
    doc.setFont("helvetica", "normal");
    doc.text(`Ad Soyad: ${s(p.patient_first_name + " " + p.patient_last_name)}`, 20, 54);
    doc.text(`TC Kimlik: ${p.patient_tc || "-----------"}`, 20, 60);

    doc.setFont("helvetica", "bold");
    doc.text("ISTEYEN DOKTOR", 120, 48);
    doc.setFont("helvetica", "normal");
    doc.text(s(`${p.doctor_title} ${p.doctor_first_name} ${p.doctor_last_name}`), 120, 54);
    doc.text(`Birim: ${s(p.specialization)}`, 120, 60);

    // --- Tablo Başlıkları ---
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 70, 170, 10, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("Tetkik Adi", 25, 77);
    doc.text("Sonuc", 85, 77);
    doc.text("Birim", 120, 77);
    doc.text("Referans Araligi", 150, 77);

    // --- Tahlil Verilerini Yazdırma ---
    let yPos = 88;
    const testData = typeof p.test_results === 'string' ? JSON.parse(p.test_results) : p.test_results;

    testData.forEach((item, index) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        // Tetkik Adı
        doc.text(s(item.test_name), 25, yPos);

        // Sonuç (Normal değilse kalın ve ok işaretli)
        if (item.status !== 'normal') {
            doc.setFont("helvetica", "bold");
            const indicator = item.status === 'high' ? "(H)" : "(L)";
            doc.text(`${item.result} ${indicator}`, 85, yPos);
            doc.setFont("helvetica", "normal");
        } else {
            doc.text(item.result, 85, yPos);
        }

        doc.text(item.unit, 120, yPos);
        doc.text(item.ref_range, 150, yPos);

        // Satır çizgisi
        doc.setDrawColor(240, 240, 240);
        doc.line(20, yPos + 3, 190, yPos + 3);
        yPos += 10;
    });

    // --- Alt Bilgi & Onay ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Bu rapor dijital olarak onaylanmistir. Islak imza gerektirmez.", 105, 280, { align: "center" });
    doc.text("Cankaya Hospital Laboratuvar Hizmetleri - 2025", 105, 285, { align: "center" });

    doc.save(`Tahlil_Raporu_${p.id}.pdf`);
};
// Helper: Bugünün tarihini YYYY-MM-DD formatında döner (Min kısıtlaması için)
const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};

export default function PatientPage({ user, onLogout }) {
    const [activeSection, setActiveSection] = useState("profile");
    const [loading, setLoading] = useState(true);
    const userId = user.userId;
    const [specializations, setSpecializations] = useState([]);
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

    const [selectedReport, setSelectedReport] = useState(null);

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



    // PatientPage.jsx içindeki filteredDoctors kısmı
    const filteredDoctors = useMemo(() => {
        if (!selectedSpecialization || !allDoctors.length) return [];

        return allDoctors.filter(d =>
            // Veritabanındaki 'specialization' ile seçilen değeri küçük harfe çevirip karşılaştır
            String(d.specialization).trim().toLowerCase() === String(selectedSpecialization).trim().toLowerCase()
        );
    }, [allDoctors, selectedSpecialization]);

    // --- SLOTLARI ÇEKME FONKSİYONU ---


       const fetchSlots = async (doctorId, date) => {
               // 1. Girdi Kontrolü
               if (!doctorId || !date) {
                   setAvailableSlots([]);
                   return;
               }

               // 2. Tarih Formatlama (Timezone kaymasını önlemek için manuel parçalama)
               const parts = date.split('-');
               const year = parseInt(parts[0], 10);
               const month = parseInt(parts[1], 10) - 1; // JS'de aylar 0-11 arasıdır
               const day = parseInt(parts[2], 10);

               const selectedDateObj = new Date(year, month, day);
               const dayOfWeek = selectedDateObj.getDay(); // 0: Pazar, 6: Cumartesi

               // 3. Hafta Sonu Kontrolü
               if (dayOfWeek === 0 || dayOfWeek === 6) {
                    setAvailableSlots([]);
                    setSlotLoading(false);
                    setAppointmentMessage({
                        type: 'error',
                        text: "Hafta sonları (Cumartesi/Pazar) randevu alınamaz."
                    });
                    return;
               }

               const dateShort = date; // YYYY-MM-DD formatını koru
               setSlotLoading(true);
               setAppointmentMessage({ type: '', text: '' });

               try {
                   // 4. API İsteği (Async/Await kullanımı düzeltildi, 'appointmen' yazım hatası giderildi)
                   const response = await getAvailableSlots(doctorId, dateShort);

                   if (!response.data || response.data.length === 0) {
                       setAvailableSlots([]);
                       setAppointmentMessage({
                           type: 'info',
                           text: "Seçilen günde müsaitlik bulunamadı."
                       });
                   } else {
                       setAvailableSlots(response.data);
                       setAppointmentMessage({ type: '', text: '' });

                       // Eğer daha önce seçilen bir saat varsa ve yeni listede yoksa seçimi temizle
                       const selectedSlotExists = response.data.some(
                           slot => slot.time === appointment.time && slot.status === 'available'
                       );
                       if (!selectedSlotExists) {
                           setAppointment(prev => ({ ...prev, time: "" }));
                       }
                   }
               } catch (error) {
                         // Hatanın Backend'den gelen GERÇEK nedenini konsola yazar
                         console.error("Backend Hata Detayı:", error.response?.data || error.message);

                         setAvailableSlots([]);
                         setAppointmentMessage({
                             type: 'error',
                             text: `Hata: ${error.response?.data?.message || "Sunucu hatası oluştu."}`
                         });
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
          const res = await getPatientProfile();

          // HATA BURADAYDI: setPatientData yerine setProfile kullanmalısın
          setProfile(res.data);

          // Düzenleme modundaki verileri de güncelle
          setEditData(res.data);
      } catch (err) {
          console.error("Profil yüklenemedi:", err);
      }
  };


    // --- PROFIL GÜNCELLEME İŞLEMLERİ ---
    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };
const prescriptions = allAppointments.filter(app =>
    app.status === 'completed' &&
    app.prescription &&
    app.prescription.trim() !== "" // Boş olmayanları göster
);

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
useEffect(() => {
    const fetchDoctors = async () => {
        try {
            const res = await getAllDoctors();
            // Konsolda gördüğümüz 'data' dizisini alıyoruz
            if (res && res.data) {
                setAllDoctors(res.data);
            }
        } catch (err) {
            console.error("Doktorlar yüklenemedi:", err);
        }
    };
    fetchDoctors();
}, []);

   // --- RANDEVU LİSTELEME İŞLEMLERİ (Saat Parsing Düzeltildi) ---
   const fetchAppointments = async () => {
       try {
           const appointmentsResponse = await getPatientAppointments();
           const appointmentsData = appointmentsResponse.data;
           const now = new Date();

           // PatientPage.jsx içindeki fetchAppointments fonksiyonu
           const processedAppointments = appointmentsData.map(a => {
               const now = new Date();
               // Saat, dakika ve saniyeyi sıfırlayarak sadece GÜN kontrolü yapıyoruz
               now.setHours(0, 0, 0, 0);

               const appointmentDate = new Date(a.appointment_date);
               appointmentDate.setHours(0, 0, 0, 0);

               // EĞER randevu tarihi bugünden ÖNCEYSE veya durumu 'scheduled' DEĞİLSE geçmiş say
               const isPast = (appointmentDate.getTime() < now.getTime()) || a.status !== 'scheduled';

               return {
                   ...a,
                   isPast: isPast,
               };
           });

           // Randevuları tarihe göre sıralayarak göstermek daha düzenli durur
           const sortedAppointments = processedAppointments.sort((a, b) =>
               new Date(b.appointment_date) - new Date(a.appointment_date)
           );

           setAllAppointments(sortedAppointments);

       } catch (error) {
           console.error("Randevu çekme hatası:", error);
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

    if (name === "doctorId") {
            // value (seçilen ID) ile doktor listesindeki doğru ID'yi eşleştiriyoruz
            const selectedDoc = allDoctors.find(d => String(d.id) === String(value) || String(d.doctor_id) === String(value));

            setAppointment(prev => ({
                ...prev,
                doctorId: value,
                // Bulunan doktorun ismini tam olarak buraya yazıyoruz
                doctorName: selectedDoc ? `${selectedDoc.title || 'Dr.'} ${selectedDoc.first_name} ${selectedDoc.last_name}` : 'Seçilmedi'
            }));
            return; // Aşağıdaki setAppointment'ın bu değişikliği ezmesini engelliyoruz
        }

    // 2. TARİH KONTROLÜ


       const handleAppointmentChange = (e) => {
           const { name, value } = e.target;

           if (name === "date" && value) {
               console.log("--- TAKVİM TETİKLENDİ ---");
               console.log("Gelen Ham Değer (Value):", value);

               const [y, m, d] = value.split('-').map(Number);
               const dateCheck = new Date(y, m - 1, d, 12, 0, 0);

               console.log("JS'in Oluşturduğu Tarih:", dateCheck.toDateString());
               console.log("Seçilen Ay:", m, "| JS Ayı:", dateCheck.getMonth() + 1);
               console.log("Gün İndeksi (0:Pazar, 6:Cumartesi):", dateCheck.getDay());

               // HATA BURADA MI? (Ay Kayması Kontrolü)
               if (dateCheck.getMonth() + 1 !== m) {
                   console.warn("⚠️ AY KAYMASI YAKALANDI! (Örn: 31 Şubat -> Mart oldu)");
                   return; // İşte bu satır hatayı susturacak olan yer.
               }

               const dayOfWeek = dateCheck.getDay();
               if (dayOfWeek === 0 || dayOfWeek === 6) {
                   console.error("❌ HAFTA SONU UYARISI VERİLİYOR!");
                   alert("Hafta sonu randevu alınamaz. Lütfen bir iş günü seçiniz.");
                   setAppointment(prev => ({ ...prev, date: "" }));
                   return;
               }
           }
           // ... diğer kısımlar ...
           setAppointment(prev => ({ ...prev, [name]: value }));
       };
    // 3. GENEL GÜNCELLEME (Tarih, Neden vb. için)
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
        console.log("Seçilen Saat:", timeSlot); // Burayı kontrol et
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
                    // KRİTİK: Buranın eklendiğinden emin olun
                    appointmentType: appointment.appointmentType || "Muayene",
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
                    setLoading(true);
                    await fetchProfile();

                    // Backend'den poliklinikleri çekiyoruz
                    const specRes = await apiService.get('/admin/specializations');
                    if (specRes && specRes.data) {
                        setSpecializations(specRes.data);
                    }

                    const doctorsResponse = await getAllDoctors();
                    setAllDoctors(doctorsResponse.data || []);


                    await fetchAppointments();
                } catch (error) {
                    console.error("Veri çekme hatası:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }, []);


    if (loading) {
        return <div className="app-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <h2 style={{ color: '#F2C94C' }}>Veriler Yükleniyor...</h2>
        </div>;
    }


    // --- RENDER FONKSİYONLARI ---

    function renderProfile() {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

        return (
            <div className="card" style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                {/* Üst Header Alanı - Kurumsal Renkler */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    padding: '30px',
                    borderRadius: '12px 12px 0 0' // Köşeleri yumuşatmak için
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Avatar */}
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f2c94c',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: 'bold', color: '#1e293b',
                            border: '4px solid rgba(255,255,255,0.1)'
                        }}>
                            {fullName.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                                    {/* İsim metni artık beyaz ve net okunur */}
                                    <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#ffffff', fontWeight: 'bold' }}>
                                        {fullName || "Cemre Güneş"}
                                    </h2>
                                    {/* Alt metin açık gri tonlarında, okunabilirlik yüksek */}
                                    <p style={{ margin: '5px 0 0 0', color: '#cbd5e1', fontSize: '0.95rem', fontWeight: '500' }}>
                                        TC: {profile.tc_no || "TC No Girilmemiş"} • Hasta Protokolü: #P-{profile.id + 1000 || "----"}
                                    </p>
                                </div>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="profile-edit-button" style={{
                                backgroundColor: '#f2c94c', color: '#1e293b', border: 'none', padding: '10px 20px',
                                borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                            }}>
                                Bilgileri Güncelle
                            </button>
                        )}
                    </div>
                </div>

                {/* İçerik Alanı - Grid Sistemi */}
                <div style={{ padding: '30px' }}>
                    {profileMessage.text && (
                        <div style={{
                            padding: '10px', borderRadius: '8px', marginBottom: '20px',
                            backgroundColor: profileMessage.type === 'error' ? '#fee2e2' : '#dcfce7',
                            color: profileMessage.type === 'error' ? '#991b1b' : '#166534', fontSize: '0.9rem'
                        }}>
                            {profileMessage.text}
                        </div>
                    )}

                    {!isEditing ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' }}>
                            {/* Kategori 1: Temel Bilgiler */}
                            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>📍 Kişisel Bilgiler</h4>
                                <div style={{ marginBottom: '10px' }}>
                                    <small style={{ display: 'block', color: '#94a3b8' }}>Doğum Tarihi</small>
                                    <strong>{profile.date_of_birth ? formatDate(profile.date_of_birth) : "Bilinmiyor"}</strong>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <small style={{ display: 'block', color: '#94a3b8' }}>Cinsiyet</small>
                                    <strong>{profile.gender || "Bilinmiyor"}</strong>
                                </div>
                                <div>
                                    <small style={{ display: 'block', color: '#94a3b8' }}>Telefon</small>
                                    <strong>{profile.phone_number || "Bilinmiyor"}</strong>
                                </div>
                            </div>

                            {/* Kategori 2: Fiziksel Veriler */}
                            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>⚖️ Fiziksel Ölçümler</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <small style={{ display: 'block', color: '#94a3b8' }}>Boy (cm)</small>
                                        <strong>{profile.height || "--"}</strong>
                                    </div>
                                    <div>
                                        <small style={{ display: 'block', color: '#94a3b8' }}>Kilo (kg)</small>
                                        <strong>{profile.weight || "--"}</strong>
                                    </div>
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <small style={{ display: 'block', color: '#94a3b8' }}>Kan Grubu</small>
                                    <span style={{
                                        backgroundColor: '#ef4444', color: 'white', padding: '2px 8px',
                                        borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold'
                                    }}>
                                        {profile.blood_type || "Bilinmiyor"}
                                    </span>
                                </div>
                            </div>

                            {/* Kategori 3: Tıbbi Kayıtlar */}
                            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>🛡️ Tıbbi Uyarılar</h4>
                                <div style={{ marginBottom: '10px' }}>
                                    <small style={{ display: 'block', color: '#94a3b8' }}>Alerjiler</small>
                                    <strong style={{ color: profile.allergies ? '#e11d48' : '#1e293b' }}>
                                        {profile.allergies || "Kayıt Yok"}
                                    </strong>
                                </div>
                                <div>
                                    <small style={{ display: 'block', color: '#94a3b8' }}>Mevcut Hastalıklar</small>
                                    <strong>{profile.diseases || "Kayıt Yok"}</strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Düzenleme Modu Formu */
                        /* renderProfile fonksiyonu içindeki "Düzenleme Modu Formu" kısmını şununla değiştir: */
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* T.C. Kimlik No */}
                            <div className="form-field">
                                <label>T.C. Kimlik No</label>
                                <input type="text" className="form-input" name="tc_no" value={editData.tc_no || ''} onChange={handleEditChange} maxLength="11" />
                            </div>

                            {/* Telefon Numarası */}
                            <div className="form-field">
                                <label>Telefon Numarası</label>
                                <input type="tel" className="form-input" name="phone_number" value={editData.phone_number || ''} onChange={handleEditChange} />
                            </div>

                            {/* Doğum Tarihi */}
                            <div className="form-field">
                                <label>Doğum Tarihi</label>
                                <input type="date" className="form-input" name="date_of_birth" value={editData.date_of_birth ? editData.date_of_birth.split('T')[0] : ''} onChange={handleEditChange} />
                            </div>

                            {/* Cinsiyet */}
                            <div className="form-field">
                                <label>Cinsiyet</label>
                                <select className="form-input" name="gender" value={editData.gender || ''} onChange={handleEditChange}>
                                    <option value="">Seçiniz</option>
                                    <option value="Erkek">Erkek</option>
                                    <option value="Kadın">Kadın</option>
                                </select>
                            </div>

                            {/* Kan Grubu */}
                            <div className="form-field">
                                <label>Kan Grubu</label>
                                <select className="form-input" name="blood_type" value={editData.blood_type || ''} onChange={handleEditChange}>
                                    <option value="">Seçiniz</option>
                                    <option value="0+">0 Rh(+)</option>
                                    <option value="0-">0 Rh(-)</option>
                                    <option value="A+">A Rh(+)</option>
                                    <option value="A-">A Rh(-)</option>
                                    <option value="B+">B Rh(+)</option>
                                    <option value="B-">B Rh(-)</option>
                                    <option value="AB+">AB Rh(+)</option>
                                    <option value="AB-">AB Rh(-)</option>
                                </select>
                            </div>

                            {/* Boy ve Kilo (Mevcutlar) */}
                            <div className="form-field">
                                <label>Boy (cm)</label>
                                <input type="number" className="form-input" name="height" value={editData.height || ''} onChange={handleEditChange} />
                            </div>
                            <div className="form-field">
                                <label>Kilo (kg)</label>
                                <input type="number" className="form-input" name="weight" value={editData.weight || ''} onChange={handleEditChange} />
                            </div>

                            {/* Alerjiler ve Hastalıklar (Mevcutlar) */}
                            <div className="form-field" style={{ gridColumn: 'span 2' }}>
                                <label>Alerjiler</label>
                                <textarea className="form-input" name="allergies" value={editData.allergies || ''} onChange={handleEditChange} style={{ height: '60px' }} />
                            </div>
                            <div className="form-field" style={{ gridColumn: 'span 2' }}>
                                <label>Hastalıklar</label>
                                <textarea className="form-input" name="diseases" value={editData.diseases || ''} onChange={handleEditChange} style={{ height: '60px' }} />
                            </div>

                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button onClick={handleSave} style={{ flex: 1, padding: '12px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✓ Değişiklikleri Kaydet</button>
                                <button onClick={handleCancel} style={{ flex: 1, padding: '12px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>İptal</button>
                            </div>
                        </div>
       )}
                   </div>
               </div>
           );
       }
   console.log("Seçilen Poliklinik:", selectedSpecialization);
   console.log("Tüm Doktorlar:", allDoctors);
   console.log("Filtrelenmiş Sonuç:", filteredDoctors);
console.log("Gönderilen Saat (Slot):", appointment.time);
    function renderCreateAppointment() {
        const isDoctorAndDateSelected = appointment.doctorId && appointment.date;
        const selectedDoctor = filteredDoctors.find(d => String(d.doctor_id || d.id) === String(appointment.doctorId));
        return (
            <div className="appointment-container" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '25px', alignItems: 'start' }}>

                {/* SOL TARAF: SEÇİM ALANI */}
                <div className="card" style={{ margin: 0 }}>
                    <div style={{ borderBottom: '2px solid #f2c94c', marginBottom: '20px', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.5rem' }}>🏥</span>
                        <h2 style={{ margin: 0 }}>Yeni Randevu Başvurusu</h2>
                    </div>

                    {appointmentMessage.text && (
                        <div className={`alert ${appointmentMessage.type}`} style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', backgroundColor: appointmentMessage.type === 'error' ? '#fff5f5' : '#f0fff4', color: appointmentMessage.type === 'error' ? '#c53030' : '#2f855a', border: '1px solid currentColor' }}>
                            {appointmentMessage.text}
                        </div>
                    )}

                    <form className="appointment-form" onSubmit={handleAppointmentSubmit}>

                        {/* ADIM 1: Poliklinik ve Doktor */}
                        <div className="form-section" style={{ marginBottom: '25px' }}>
                            <h4 style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '15px' }}>1. Uzmanlık ve Hekim Seçimi</h4>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-field">
                                    <label style={{ fontWeight: '600' }}>Poliklinik</label>
                                    <select className="form-input" name="specialization" value={selectedSpecialization} onChange={handleSpecializationChange} required>
                                        <option value="">— Poliklinik Seçin —</option>
                                        {specializations.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label style={{ fontWeight: '600' }}>Doktor</label>
                                    <select
                                        className="form-input"
                                        name="doctorId"
                                        value={appointment.doctorId}
                                        onChange={handleAppointmentChange}
                                        required
                                    >
                                        <option value="">— Doktor Seçin —</option>
                                        {filteredDoctors.map((doctor) => (
                                            // Sadece doctor.id kullanıyoruz
                                            <option key={doctor.id} value={doctor.id}>
                                                {doctor.title || 'Dr.'} {doctor.first_name} {doctor.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ADIM 2: Tarih ve Saat */}
                        <div className="form-section" style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                            <h4 style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '15px' }}>2. Takvim ve Saat Dilimi</h4>
                            <div className="form-field">
                                <label style={{ fontWeight: '600' }}>Randevu Tarihi</label>
                                <input type="date" className="form-input" name="date" value={appointment.date} onChange={handleAppointmentChange} required min={getTodayDate()} disabled={!appointment.doctorId} style={{ maxWidth: '250px' }} />
                            </div>

                            <div className="form-field" style={{ marginTop: '15px' }}>
                                <label style={{ fontWeight: '600', display: 'block', marginBottom: '10px' }}>Uygun Randevu Saatleri</label>
                                {slotLoading ? (
                                    <div className="loader-small">Saatler sorgulanıyor...</div>
                                ) : !isDoctorAndDateSelected ? (
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center' }}>
                                        Takvimi görüntülemek için lütfen doktor ve tarih seçiniz.
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <div style={{ color: '#e53e3e', padding: '10px', backgroundColor: '#fff5f5', borderRadius: '8px', fontSize: '0.9rem' }}>
                                        Seçilen günde müsaitlik bulunamadı.
                                    </div>
                                ) : (
                                    <div className="slot-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px' }}>
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot.time}
                                                type="button"
                                                className={`slot-chip ${appointment.time === slot.time ? 'active' : ''} ${slot.status}`}
                                                style={{
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    border: '1px solid',
                                                    borderColor: appointment.time === slot.time ? '#f2c94c' : '#e2e8f0',
                                                    backgroundColor: appointment.time === slot.time ? '#fef9c3' : slot.status === 'available' ? '#fff' : '#f1f5f9',
                                                    color: slot.status === 'available' ? '#1e293b' : '#94a3b8',
                                                    cursor: slot.status === 'available' ? 'pointer' : 'not-allowed',
                                                    fontWeight: appointment.time === slot.time ? 'bold' : 'normal',
                                                    transition: 'all 0.2s'
                                                }}
                                                onClick={() => slot.status === 'available' && handleTimeSelect(slot.time)}
                                                disabled={slot.status !== 'available'}
                                            >
                                                {slot.time}
                                                {slot.status !== 'available' && <span style={{ fontSize: '8px', display: 'block' }}>DOLU</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ADIM 3: Detaylar */}
                        <div className="form-section">
                            <h4 style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '15px' }}>3. Randevu Detayları</h4>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                                <div className="form-field">
                                    <label style={{ fontWeight: '600' }}>Randevu Türü</label>
                                    <select className="form-input" name="appointmentType" value={appointment.appointmentType} onChange={handleAppointmentChange} required>
                                        <option value="Muayene">Muayene</option>
                                        <option value="Sonuç">Sonuç/Rapor Gösterme</option>
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label style={{ fontWeight: '600' }}>Başvuru Nedeni</label>
                                    <input className="form-input" name="reason" placeholder="Kısa bir açıklama yazınız..." value={appointment.reason} onChange={handleAppointmentChange} required />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* SAĞ TARAF: ÖZET PANELİ */}
                <div className="summary-panel" style={{ position: 'sticky', top: '20px' }}>
                    <div className="card" style={{ border: '2px solid #f2c94c', backgroundColor: '#fffdf5' }}>
                        <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#856404' }}>📅 Randevu Özeti</h3>
                        <hr style={{ border: 'none', borderTop: '1px solid #f2c94c', margin: '15px 0', opacity: 0.3 }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                            <div>
                                <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>DOKTOR</span>
                                 <strong>{appointment.doctorName || 'Seçilmedi'}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>POLİKLİNİK</span>
                                <strong>{selectedSpecialization || 'Seçilmedi'}</strong>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                <div>
                                    <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>TARİH</span>
                                    <strong>{appointment.date || 'Seçilmedi'}</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>SAAT</span>
                                    <strong>{appointment.time || 'Seçilmedi'}</strong>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff5f5', borderRadius: '6px', borderLeft: '4px solid #e53e3e' }}>
                            <small style={{ color: '#c53030', fontWeight: 'bold' }}>⚠️ Önemli Hatırlatma:</small>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: '#666' }}>Lütfen randevu saatinizden 15 dakika önce kayıt işlemleriniz için hastanemizde olunuz.</p>
                        </div>

                        <button
                            onClick={handleAppointmentSubmit}
                            disabled={!appointment.doctorId || !appointment.date || !appointment.time || !appointment.reason}
                            style={{
                                width: '100%',
                                marginTop: '20px',
                                backgroundColor: '#f2c94c',
                                color: '#333',
                                border: 'none',
                                padding: '15px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px rgba(242, 201, 76, 0.2)',
                                opacity: (!appointment.doctorId || !appointment.date || !appointment.time || !appointment.reason) ? 0.5 : 1
                            }}
                        >
                            ✓ RANDEVUYU ONAYLA
                        </button>
                    </div>
                </div>
            </div>
        );
    }
// --- REÇETELERİ LİSTELE ---
function renderPrescriptions() {
   if (!allAppointments) return <p>Yükleniyor...</p>;
    // Sadece reçete yazılmış olan randevuları filtrele
    const prescriptions = allAppointments.filter(a =>
            a.prescription &&
            String(a.prescription).trim() !== "" &&
            a.prescription !== "null"
        );
    return (
        <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>💊</span> Reçetelerim
            </h2>
            <hr style={{ border: 'none', borderTop: '2px solid #f2c94c', marginBottom: '20px', opacity: 0.3 }} />

            {prescriptions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    <p>Henüz adınıza düzenlenmiş bir dijital reçete bulunmamaktadır.</p>
                </div>
            ) : (
                <div className="prescriptions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {prescriptions.map(p => (
                        <div key={p.id} className="prescription-card" style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            background: '#fff',
                            overflow: 'hidden',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                            position: 'relative'
                        }}>
                            {/* Reçete Üst Şeridi */}
                            <div style={{ backgroundColor: '#f2c94c', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#333' }}>E-REÇETE NO: #REC-{p.id + 5000}</span>
                                <span style={{ fontSize: '0.75rem', color: '#333' }}>{new Date(p.appointment_date).toLocaleDateString()}</span>
                            </div>

                            <div style={{ padding: '15px' }}>
                                {/* Doktor Bilgisi */}
                                <div style={{ marginBottom: '15px', borderBottom: '1px dashed #eee', paddingBottom: '10px' }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>{p.doctor_title} {p.doctor_first_name} {p.doctor_last_name}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>{p.specialization || "Genel Poliklinik"}</p>
                                </div>

                                {/* İlaç Detayı */}
                                <div style={{ backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #2ecc71' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#27ae60', fontWeight: 'bold', textTransform: 'uppercase' }}>💊 Yazılan İlaçlar ve Talimatlar</label>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '1rem', color: '#333', lineHeight: '1.5', fontStyle: 'italic' }}>
                                        {p.prescription}
                                    </p>
                                </div>

                                {/* Kullanım Yardımcısı (Görsel Detay) */}
                                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-around', opacity: 0.6 }}>
                                    <div style={{ textAlign: 'center', fontSize: '0.7rem' }}>☀️<br/>Sabah</div>
                                    <div style={{ textAlign: 'center', fontSize: '0.7rem' }}>🌤️<br/>Öğle</div>
                                    <div style={{ textAlign: 'center', fontSize: '0.7rem' }}>🌙<br/>Akşam</div>
                                    <div style={{ textAlign: 'center', fontSize: '0.7rem' }}>💤<br/>Gece</div>
                                </div>
                            </div>

                            {/* Reçete Alt Bilgisi */}
                            <div style={{ padding: '10px 15px', background: '#fcfcfc', borderTop: '1px solid #eee', textAlign: 'right' }}>
                                <button
                                    onClick={() => {
                                        // Eğer p içinde hasta adı yoksa, mevcut state'ten ekliyoruz
                                        const pdfData = {
                                            ...p,
                                            patient_first_name: p.patient_first_name || user?.first_name, // user senin login olan hasta state'in olmalı
                                            patient_last_name: p.patient_last_name || user?.last_name,
                                            patient_tc: p.patient_tc || user?.tc_no
                                        };
                                        downloadPrescriptionPDF(pdfData);
                                    }}
                                >
                                    📥 PDF İndir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
// --- EPİKRİZ (DOKTOR NOTLARI) LİSTELE ---
function renderEpicrisis() {
    const notes = allAppointments.filter(a => a.doctor_note);
    return (
        <div className="card">
            <h2>📄 Epikriz Bilgileri</h2>
            {notes.length === 0 ? <p>Kayıtlı epikriz raporunuz bulunmamaktadır.</p> : (
                <div className="health-data-grid">
                    {notes.map(n => (
                        <div key={n.id} className="health-data-item" style={{borderLeft: '4px solid #64748b', padding: '10px', marginBottom: '10px', background: '#f8fafc'}}>
                            <strong>📅 {new Date(n.appointment_date).toLocaleDateString()}</strong> - {n.specialization}
                            <p style={{marginTop: '5px', fontStyle: 'italic'}}>"{n.doctor_note}"</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function renderReportModal() {
    if (!selectedReport) return null;

    return (
        <div className="custom-modal-overlay" onClick={() => setSelectedReport(null)}>
            <div className="custom-modal-content report-paper" onClick={(e) => e.stopPropagation()} style={{ borderTop: '10px solid #f2c94c' }}>

                {/* Rapor Üst Başlık */}
                <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="hospital-info">
                        {/* Hastane ismi sarı ve vurgulu yapıldı */}
                        <h3 style={{ margin: 0, color: '#f2c94c', fontSize: '1.4rem', fontWeight: '900', textShadow: '1px 1px 1px #000' }}>ÇANKAYA HOSPITAL</h3>
                        <p style={{ fontSize: '0.75rem', margin: 0, color: '#555', fontWeight: 'bold' }}>Özel Sağlık Hizmetleri A.Ş.</p>
                    </div>
                    <div className="report-meta-top" style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                        <p style={{ margin: 0 }}><strong>Protokol No:</strong> #PRT-{selectedReport.id + 1000}</p>
                        <p style={{ margin: 0 }}><strong>Tarih:</strong> {new Date(selectedReport.appointment_date).toLocaleDateString()}</p>
                        <p style={{ margin: 0, color: '#888', fontSize: '0.7rem' }}>Doğrulama Kodu: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                    </div>
                </div>

                <hr style={{ margin: '15px 0', border: 'none', borderTop: '2px solid #f2c94c', opacity: 0.3 }} />

                <div className="modal-body" style={{ fontSize: '0.9rem', color: '#333' }}>
                    {/* Bölüm 1: Muayene Bilgileri */}
                    <div className="report-section" style={{ marginBottom: '15px' }}>
                        <h4 style={{ backgroundColor: '#fdf9e7', padding: '4px 8px', borderLeft: '4px solid #f2c94c', marginBottom: '8px', fontSize: '0.85rem' }}>
                            🏥 MUAYENE BİLGİLERİ
                        </h4>
                        <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '0 5px' }}>
                            <p><strong>Poliklinik:</strong> {selectedReport.specialization || "Genel Muayene"}</p>
                            <p><strong>Doktor:</strong> {selectedReport.doctor_title} {selectedReport.doctor_first_name} {selectedReport.doctor_last_name}</p>
                            <p><strong>Randevu Tipi:</strong> {selectedReport.appointmentType || "Genel Muayene"}</p>
                            <p><strong>Saat:</strong> {selectedReport.time || "00:00"}</p>
                        </div>
                    </div>

                    {/* Bölüm 2: Tanı ve Klinik Notlar */}
                    <div className="report-section">
                        <h4 style={{ backgroundColor: '#fdf9e7', padding: '4px 8px', borderLeft: '4px solid #f2c94c', marginBottom: '8px', fontSize: '0.85rem' }}>
                            📝 KLİNİK DEĞERLENDİRME & TANI
                        </h4>

                        <div className="note-container" style={{ padding: '0 5px' }}>
                            {/* Şikayet Alanı */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#f2c94c', textTransform: 'uppercase', display: 'block' }}>
                                    Şikayet / Geliş Nedeni
                                </label>
                                <div style={{ padding: '8px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#fffdf5', marginTop: '3px', minHeight: '30px' }}>
                                    {selectedReport.reason || "Belirtilmedi"}
                                </div>
                            </div>

                            {/* Doktor Notu Alanı */}
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#666', textTransform: 'uppercase', display: 'block' }}>
                                    Doktorun Klinik Notu / Tanı
                                </label>
                                <div style={{ padding: '8px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#f9f9f9', marginTop: '3px', fontStyle: 'italic', color: '#444' }}>
                                    {selectedReport.doctor_note || "Klinik bulgu girilmemiştir."}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* EKSTRA: Tıbbi Uyarı Notu */}
                    <div style={{ marginTop: '15px', padding: '8px', backgroundColor: '#fff5f5', border: '1px dashed #feb2b2', borderRadius: '4px', fontSize: '0.75rem' }}>
                        <strong>⚠️ Önemli Uyarı:</strong> Bu rapor tıbbi bir belgedir. İlaç kullanımı ve tedavi süreci için doktorunuzun talimatlarına uyunuz. Beklenmedik bir durumda en yakın sağlık kuruluşuna başvurunuz.
                    </div>

                    {/* Bölüm 3: ICD Kodları ve Kaşe */}
                    <div className="report-footer-info" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <p style={{ color: '#aaa', fontSize: '0.7rem', margin: 0 }}>ICD-10 Kodu: Z00.0</p>
                            {/* Barkod Simülasyonu */}
                            <div style={{ width: '100px', height: '20px', backgroundColor: '#333', display: 'flex', gap: '2px', padding: '2px' }}>
                                {[...Array(15)].map((_, i) => (
                                    <div key={i} style={{ flex: 1, backgroundColor: 'white', width: Math.random() > 0.5 ? '1px' : '2px' }}></div>
                                ))}
                            </div>
                        </div>
                        <div className="doctor-stamp" style={{ textAlign: 'center', minWidth: '150px' }}>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#888' }}>e-İmzalıdır</p>
                            <p style={{ margin: '2px 0', borderBottom: '1px solid #eee', paddingBottom: '2px' }}><strong>{selectedReport.doctor_first_name} {selectedReport.doctor_last_name}</strong></p>
                            <small style={{ color: '#666' }}>{selectedReport.doctor_title}</small>
                        </div>
                    </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button className="print-btn" style={{ flex: 1, padding: '10px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ddd' }} onClick={() => window.print()}>🖨️ Yazdır</button>
                    <button className="close-btn" style={{ flex: 1, padding: '10px', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px' }} onClick={() => setSelectedReport(null)}>Kapat</button>
                </div>
            </div>
        </div>
    );
}
//tahliller
console.log("renderTestResults ÇALIŞTI");


function renderTestResults() {
    // 1. GÜVENLİK: allAppointments tanımlı değilse boş dizi kabul et
    const currentAppointments = typeof allAppointments !== 'undefined' ? allAppointments : [];

    // Veritabanından gelen tahlilleri filtrele
    const realTests = currentAppointments.filter(a => a && a.test_results && a.test_results !== null);

    const mockData = [
        {
            id: "sample-1",
            appointment_date: "2025-12-28",
            doctor_title: "Doç. Dr.",
            doctor_first_name: "Kemal",
            doctor_last_name: "Doğan",
            specialization: "Genel Dahiliye",
            test_results: [
                { test_name: "Hemoglobin (HGB)", result: "12.4", unit: "g/dL", ref_range: "13.5 - 17.5", status: "low" },
                { test_name: "WBC (Akyuvar)", result: "7.8", unit: "10^3/µL", ref_range: "4.5 - 11.0", status: "normal" },
                { test_name: "Glukoz (Açlık)", result: "105", unit: "mg/dL", ref_range: "70 - 100", status: "high" },
                { test_name: "B12 Vitamini", result: "180", unit: "pg/mL", ref_range: "200 - 900", status: "low" }
            ]
        }
    ];

    const displayData = realTests.length > 0 ? realTests : mockData;

    return (
        <div className="card">
            <h2 style={{ color: '#2c3e50', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>🧪</span> Tahlil Sonuçlarım
            </h2>

            {displayData.map((testGroup) => {
                let results = [];
                try {
                    // Veritabanından gelen veri string ise parse et, değilse direkt kullan
                    results = typeof testGroup.test_results === 'string'
                        ? JSON.parse(testGroup.test_results)
                        : testGroup.test_results;
                } catch (e) {
                    results = Array.isArray(testGroup.test_results) ? testGroup.test_results : [];
                }

                if (!results || results.length === 0) {
                    return (
                        <div key={testGroup.id} style={{ padding: '20px', textAlign: 'center', color: '#bdc3c7' }}>
                            Bu randevuya ait tahlil sonucu bulunmamaktadır.
                        </div>
                    );
                }

                return (
                    <div key={testGroup.id} className="test-container" style={{
                        marginBottom: '30px',
                        border: '1px solid #eef2f3',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        backgroundColor: '#fff'
                    }}>
                        <div style={{ backgroundColor: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong style={{ color: '#34495e', display: 'block' }}>Laboratuvar Raporu</strong>
                                <small style={{ color: '#95a5a6' }}>İsteyen: {testGroup.doctor_title} {testGroup.doctor_first_name} {testGroup.doctor_last_name}</small>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2c3e50' }}>{new Date(testGroup.appointment_date).toLocaleDateString('tr-TR')}</div>
                                {realTests.length === 0 && <span style={{fontSize: '0.7rem', color: '#f2c94c', fontWeight: 'bold'}}>ÖRNEK GÖRÜNÜM</span>}
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#fff', borderBottom: '2px solid #f1f1f1' }}>
                                    <th style={{ padding: '12px 20px', fontSize: '0.8rem', color: '#95a5a6' }}>TETKİK ADI</th>
                                    <th style={{ padding: '12px', fontSize: '0.8rem', color: '#95a5a6' }}>SONUÇ</th>
                                    <th style={{ padding: '12px', fontSize: '0.8rem', color: '#95a5a6' }}>BİRİM</th>
                                    <th style={{ padding: '12px', fontSize: '0.8rem', color: '#95a5a6' }}>REFERANS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f9f9f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfc' }}>
                                        <td style={{ padding: '15px 20px', fontSize: '0.9rem', color: '#2c3e50', fontWeight: '500' }}>{item.test_name}</td>
                                        <td style={{ padding: '15px 12px' }}>
                                            <span style={{
                                                fontWeight: 'bold',
                                                color: item.status === 'normal' ? '#27ae60' : '#e74c3c',
                                                fontSize: '1rem'
                                            }}>
                                                {item.result}
                                                {item.status === 'high' ? ' ▲' : item.status === 'low' ? ' ▼' : ''}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 12px', fontSize: '0.85rem', color: '#7f8c8d' }}>{item.unit}</td>
                                        <td style={{ padding: '15px 12px', fontSize: '0.85rem', color: '#7f8c8d', fontStyle: 'italic' }}>{item.ref_range}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ padding: '12px 20px', backgroundColor: '#fafafa', textAlign: 'right', borderTop: '1px solid #eee' }}>
                            <button
                                onClick={() => realTests.length > 0 ? downloadTestResultsPDF(testGroup) : alert("Örnek rapor PDF indirilemez.")}
                                style={{ backgroundColor: '#2c3e50', color: '#fff', border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                📄 PDF Raporu İndir
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
// --- RAPORLARI LİSTELE ---
function renderReports() {
    // Raporları filtrele: Sadece doktor notu olan veya tamamlanmış randevular
    const reports = allAppointments.filter(a =>
        (a.doctor_note && a.doctor_note.trim() !== "") || a.status === 'completed'
    );

    if (reports.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📜</div>
                <p>Henüz adınıza düzenlenmiş bir tıbbi rapor bulunmamaktadır.</p>
            </div>
        );
    }

    return (
        <div className="card">
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>📜 Tıbbi Raporlarım</h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>
                    Toplam {reports.length} Kayıt
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                {reports.map((r) => (
                    <div key={r.id} className="report-card" style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '15px',
                        backgroundColor: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'box-shadow 0.2s',
                        cursor: 'default'
                    }}>
                        {/* Üst Kısım: İkon ve Tarih */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{
                                backgroundColor: '#fef9c3',
                                color: '#856404',
                                padding: '8px',
                                borderRadius: '8px',
                                fontSize: '1.2rem'
                            }}>
                                📄
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>
                                    {new Date(r.appointment_date).toLocaleDateString('tr-TR')}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>#PROT-{r.id + 1000}</div>
                            </div>
                        </div>

                        {/* Orta Kısım: İçerik */}
                        <div style={{ marginBottom: '15px' }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#1e293b' }}>
                                {r.specialization || "Genel Muayene Raporu"}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                                Dr. {r.doctor_first_name} {r.doctor_last_name}
                            </p>
                            <div style={{
                                marginTop: '10px',
                                padding: '8px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                color: '#475569',
                                borderLeft: '3px solid #cbd5e1',
                                minHeight: '40px'
                            }}>
                                {r.doctor_note ? (r.doctor_note.substring(0, 80) + (r.doctor_note.length > 80 ? "..." : "")) : "Muayene bulguları sisteme işlenmiştir."}
                            </div>
                        </div>

                        {/* Alt Kısım: Aksiyon Butonu */}
                        <button
                            className="view-report-btn"
                            onClick={() => setSelectedReport(r)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                backgroundColor: '#1e293b',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            👁️ Detayları Görüntüle
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function renderRadiology() {
    // Veritabanından gelen radyoloji verilerini filtrele (Status completed olanlar üzerinden gidebiliriz)
    // Şimdilik sadece örnek veriyi gösterelim
    const mockRadiology = [
      {
        id: "rad-1",
        type: "MR",
        title: "Lomber Spinal MR (Bel Emarı)",
        date: "2025-11-15",
        doctor: "Dr. Selim Yılmaz",
        policlinic: "Radyoloji",
        conclusion: "L4-L5 seviyesinde hafif düzeyde bulging izlenmiştir. Sinir kökü basısı saptanmadı.",
        image_status: "Görüntü Hazır"
      },
      {
        id: "rad-2",
        type: "X-RAY",
        title: "Akciğer Grafisi (PA)",
        date: "2025-12-01",
        doctor: "Dr. Ayşe Kaya",
        policlinic: "Göğüs Hastalıkları",
        conclusion: "Kardiyotorasik oran normaldir. Aktif parankimal infiltrasyon saptanmadı.",
        image_status: "Görüntü Hazır"
      }
    ];

    return (
        <div className="card" style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>🩻</span> Radyolojik Görüntülerim
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                {mockRadiology.map((rad) => (
                    <div key={rad.id} style={{
                        border: '1px solid #e0e6ed',
                        borderRadius: '12px',
                        background: '#fff',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.03)',
                        display: 'flex',
                        overflow: 'hidden'
                    }}>
                        {/* Sol İkon Alanı */}
                        <div style={{
                            width: '100px',
                            background: '#f8f9fa',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRight: '1px solid #eee'
                        }}>
                            <span style={{ fontSize: '2rem' }}>{rad.type === 'MR' ? '🧠' : '🩻'}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', marginTop: '5px', color: '#7f8c8d' }}>{rad.type}</span>
                        </div>

                        {/* İçerik Alanı */}
                        <div style={{ padding: '20px', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2c3e50' }}>{rad.title}</h3>
                                <span style={{ fontSize: '0.85rem', color: '#95a5a6' }}>{rad.date}</span>
                            </div>

                            <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#7f8c8d' }}>
                                👨‍⚕️ <strong>Raporlayan:</strong> {rad.doctor} | {rad.policlinic}
                            </p>

                            <div style={{
                                backgroundColor: '#fdfefe',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #ebf2f5',
                                marginBottom: '15px'
                            }}>
                                <strong style={{ fontSize: '0.8rem', color: '#34495e' }}>RAPOR SONUCU:</strong>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#546e7a', fontStyle: 'italic' }}>
                                    "{rad.conclusion}"
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '8px 15px', backgroundColor: '#34495e' }}>
                                    🖼️ Görüntüyü Aç
                                </button>
                                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 15px' }}>
                                    📄 Raporu İndir
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- TAHLİL VE RADYOLOJİ (Şablon) ---
function renderPlaceholder(title, icon) {
    return (
        <div className="card">
            <h2>{icon} {title}</h2>
            <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>
                <p>Bu bölüme ait dijital kayıtlarınız henüz sisteme yüklenmemiştir.</p>
                <small>Lütfen sonuçlarınız için ilgili poliklinik ile iletişime geçin.</small>
            </div>
        </div>
    );
}
    // --- YENİ BİRLEŞİK RANDEVU LİSTESİ RENDER FONKSİYONU ---
   function renderAppointmentsList() {
       if (!allAppointments || allAppointments.length === 0) {
           return (
               <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                   <p>Henüz kayıtlı bir randevunuz bulunmamaktadır.</p>
               </div>
           );
       }

       const getStatusStyles = (status) => {
           switch (status) {
               case 'scheduled': return { label: 'Planlandı', color: '#3b82f6', bg: '#eff6ff' };
               case 'completed': return { label: 'Bitti', color: '#10b981', bg: '#ecfdf5' };
               case 'canceled': return { label: 'İptal', color: '#ef4444', bg: '#fef2f2' };
               default: return { label: '---', color: '#6b7280', bg: '#f3f4f6' };
           }
       };

       return (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {allAppointments.map((a) => {
                   const styles = getStatusStyles(a.status);
                   const appDate = new Date(a.appointment_date);

                   return (
                       <div key={a.id} style={{
                           display: 'flex',
                           alignItems: 'center',
                           padding: '10px 15px',
                           backgroundColor: '#fff',
                           borderRadius: '8px',
                           border: '1px solid #e2e8f0',
                           borderLeft: `4px solid ${a.isPast ? '#cbd5e1' : styles.color}`,
                           fontSize: '0.85rem'
                       }}>
                           {/* Tarih ve Saat (Kompakt Yan Yana) */}
                           <div style={{ minWidth: '90px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #f1f5f9' }}>
                               {appDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })} | {a.time}
                           </div>

                           {/* Doktor ve Bölüm (Daha İnce) */}
                           <div style={{ flex: 2, paddingLeft: '15px' }}>
                               <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                                   Dr. {a.doctor_first_name} {a.doctor_last_name}
                               </div>
                               <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                   {a.specialization}
                               </div>
                           </div>

                           {/* Durum (Küçük Chip) */}
                           <div style={{ flex: 1, textAlign: 'center' }}>
                               <span style={{
                                   fontSize: '0.65rem',
                                   fontWeight: 'bold',
                                   padding: '2px 8px',
                                   borderRadius: '10px',
                                   backgroundColor: styles.bg,
                                   color: styles.color,
                                   textTransform: 'uppercase'
                               }}>
                                   {styles.label}
                               </span>
                           </div>

                           {/* Neden (Kısaltılmış) */}
                           <div style={{ flex: 2, color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', padding: '0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                               {a.reason || '-'}
                           </div>

                           {/* İşlem Butonu (Küçük) */}
                           <div style={{ minWidth: '80px', textAlign: 'right' }}>
                               {!a.isPast && a.status === 'scheduled' ? (
                                   <button
                                       onClick={() => handleCancelAppointment(a.id)}
                                       style={{
                                           padding: '4px 10px',
                                           backgroundColor: 'transparent',
                                           color: '#ef4444',
                                           border: '1px solid #ef4444',
                                           borderRadius: '5px',
                                           cursor: 'pointer',
                                           fontSize: '0.75rem',
                                           fontWeight: 'bold'
                                       }}
                                   >
                                       İptal
                                   </button>
                               ) : (
                                   <span style={{ fontSize: '1rem' }}>
                                       {a.status === 'completed' ? '✅' : '⌛'}
                                   </span>
                               )}
                           </div>
                       </div>
                   );
               })}
           </div>
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
                           👤 Profil
                        </button>

                        <button
                            className={"sidebar-button" + (activeSection === "create" ? " sidebar-button-active" : "")}
                            onClick={() => setActiveSection("create")}
                        >
                           📅 Randevu Oluştur
                        </button>

                        {/* TEK RANDEVU LİSTESİ BUTONU */}
                        <button
                            className={"sidebar-button" + (activeSection === "appointments" ? " sidebar-button-active" : "")}
                            onClick={() => setActiveSection("appointments")}
                        >
                           📋 Tüm Randevularım
                        </button>

                        <button
                            className={"sidebar-button" + (activeSection === "reports" ? " sidebar-button-active" : "")}
                            onClick={() => setActiveSection("reports")}
                        >
                            📜 Raporlarım
                        </button>

                        <button
                                className={"sidebar-button" + (activeSection === "prescriptions" ? " sidebar-button-active" : "")}
                                onClick={() => setActiveSection("prescriptions")}
                            >
                                💊 Reçetelerim
                            </button>
                            <button
                                className={"sidebar-button" + (activeSection === "lab_results" ? " sidebar-button-active" : "")}
                                onClick={() => setActiveSection("lab_results")}
                            >
                                🧪 Tahlil Sonuçlarım
                            </button>
                            <button
                                className={"sidebar-button" + (activeSection === "radiology" ? " sidebar-button-active" : "")}
                                onClick={() => setActiveSection("radiology")}
                            >
                                🩻 Radyolojik Görüntüler
                            </button>
                            <button
                                className={"sidebar-button" + (activeSection === "epicrisis" ? " sidebar-button-active" : "")}
                                onClick={() => setActiveSection("epicrisis")}
                            >
                                📄 Epikriz Bilgileri
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

               {/* YENİ EKLENEN BÖLÜMLERİN ÇALIŞTIRILMASI */}
               {activeSection === "prescriptions" && renderPrescriptions()}
               {activeSection === "epicrisis" && renderEpicrisis()}
               {activeSection === "reports" && renderReports()}

               {/* ŞABLON (PLACEHOLDER) BÖLÜMLER */}
               {activeSection === "lab_results" && renderTestResults()}
               {activeSection === "radiology" && renderRadiology()}
                {activeSection === "pathology" && renderPlaceholder("Patoloji Bilgileri", "🔬")}
           </main>
           {renderReportModal()}
                      </div>
                    ); // Bu parantez PatientPage fonksiyonunu kapatır.
                }