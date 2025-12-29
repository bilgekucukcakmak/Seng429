// DoctorPage.jsx en üst kısım
import { useEffect, useState } from "react";
import "../styles/layout.css";
import React from 'react';

// 'api' kelimesini süslü parantezin başına, virgülle ayırarak ekle
import api, {
    getDoctorAppointments,
    getPatientByTc,
    updateAppointmentStatus,
    updateDoctorProfile,
    getDoctorProfile,
    getDoctorLeaveDates,
    updateDoctorLeaveDates,
    getPatientAppointmentsByTc,
    initializeAuthToken,
    getPatientHistory,
} from "../services/api"; //
// src/pages/DoctorPage.jsx

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // autoTable'ı bu şekilde import edin


// --- PDF ÜRETME FONKSİYONU
const fixTurkishChars = (text) => {
    if (!text) return "";
    return text
        .replace(/ğ/g, "g").replace(/Ğ/g, "G")
        .replace(/ü/g, "u").replace(/Ü/g, "U")
        .replace(/ş/g, "s").replace(/Ş/g, "S")
        .replace(/ı/g, "i").replace(/İ/g, "I")
        .replace(/ö/g, "o").replace(/Ö/g, "O")
        .replace(/ç/g, "c").replace(/Ç/g, "C");
};
const downloadPrescriptionPDF = (p) => {
    const doc = new jsPDF();

    // Rapor Başlığı
    doc.setFontSize(20);
    doc.setTextColor(242, 201, 76); // Çankaya Hospital Sarısı
    doc.text("CANKAYA HOSPITAL", 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Tıbbi E-Reçete Belgesi", 20, 30);
    doc.text(`Tarih: ${new Date(p.appointment_date).toLocaleDateString()}`, 150, 30);
    doc.line(20, 35, 190, 35); // Çizgi

    // Doktor ve Hasta Bilgileri
    doc.text(`Doktor: ${p.doctor_title} ${p.doctor_first_name} ${p.doctor_last_name}`, 20, 45);
    doc.text(`Poliklinik: ${p.specialization || "Genel"}`, 20, 52);
    doc.text(`E-Reçete No: #REC-${p.id + 5000}`, 20, 59);

    // İlaçlar
    doc.setFontSize(14);
    doc.text("Yazılan İlaçlar:", 20, 75);

    doc.setFontSize(11);
    const medicines = p.prescription.split(", ");
    medicines.forEach((med, index) => {
        doc.text(`- ${med}`, 25, 85 + (index * 7));
    });

    // Alt Not
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Bu belge elektronik ortamda oluşturulmuştur.", 20, 280);

    // Dosyayı İndir
    doc.save(`Recete_${p.id}.pdf`);
};
// --- PDF ÜRETME FONKSİYONU (Reçete Desteği Eklendi)
const generatePDFReport = (appointment, patientDetails, doctorProfile, prescriptionList) => {
    const doc = new jsPDF();

    // Başlık
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CANKAYA HOSPITAL", 105, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text(fixTurkishChars("MUAYENE VE TANI RAPORU"), 105, 30, { align: "center" });
    doc.line(20, 35, 190, 35);

    autoTable(doc, {
        startY: 40,
        head: [[fixTurkishChars('BILGI TURU'), fixTurkishChars('DETAYLAR')]],
        body: [
            [fixTurkishChars('Rapor Tarihi'), new Date().toLocaleDateString('tr-TR')],
            [fixTurkishChars('Randevu Tarihi'), formatDate(appointment.appointment_date)],
            [fixTurkishChars('Hasta Ad Soyad'), fixTurkishChars(appointment.patientName)],
            [fixTurkishChars('Hasta TC No'), patientDetails?.tc_no || '---'],
            [fixTurkishChars('Doktor'), fixTurkishChars(`${doctorProfile.title} ${doctorProfile.firstName} ${doctorProfile.lastName}`)],
            [fixTurkishChars('Brans'), fixTurkishChars(doctorProfile.specialization)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 123, 255] },
        styles: { font: "helvetica", fontSize: 10 },
    });

    let finalY = doc.lastAutoTable.finalY + 15;

    // MUAYENE NOTLARI
    doc.setFontSize(14);
    doc.setTextColor(0, 123, 255);
    doc.text(fixTurkishChars("MUAYENE BULGULARI VE NOTLAR:"), 20, finalY);

    doc.setFontSize(11);
    doc.setTextColor(50);
    const rawNote = appointment.doctor_note || "Bu muayene icin doktor notu girilmemistir.";
    const splitNote = doc.splitTextToSize(fixTurkishChars(rawNote), 170);
    doc.text(splitNote, 20, finalY + 10);

    // --- YENİ: REÇETE / İLAÇLAR BÖLÜMÜ ---
    finalY = finalY + 20 + (splitNote.length * 5);
    doc.setFontSize(14);
    doc.setTextColor(0, 123, 255);
    doc.text(fixTurkishChars("RECETE / ILACLAR:"), 20, finalY);

    doc.setFontSize(11);
    doc.setTextColor(50);
    if (prescriptionList && prescriptionList.length > 0) {
        prescriptionList.forEach((med, index) => {
            doc.text(`${index + 1}. ${fixTurkishChars(med)}`, 25, finalY + 10 + (index * 7));
        });
    } else {
        doc.text(fixTurkishChars("Recete yazilmamistir."), 25, finalY + 10);
    }

    // İMZA
    const signatureY = Math.max(finalY + 40, 250); // Sayfa sonuna yakın ayarla
    doc.setFontSize(10);
    doc.text(fixTurkishChars("Doktor Imzasi:"), 150, signatureY);
    doc.text("_________________", 150, signatureY + 10);

    doc.save(`Rapor_Recete_${appointment.patientName.replace(/\s+/g, "_")}.pdf`);
};
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    // --- TAKVİM VE İZİN YÖNETİMİ STATE'LERİ ---
    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
    const [leaveDates, setLeaveDates] = useState([]); // İzinli günler (YYYY-MM-DD formatında)
    const [leaveDateInput, setLeaveDateInput] = useState(''); // İzin ekleme inputu
    const [leaveLoading, setLeaveLoading] = useState(false);
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
    const [searchTc, setSearchTc] = useState('');
    const [patientInfo, setPatientInfo] = useState(null);
    const [patientError, setPatientError] = useState("");
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [doctorNote, setDoctorNote] = useState('');
    const [quickPatientInfo, setQuickPatientInfo] = useState(null);
    const [queriedPatientAppointments, setQueriedPatientAppointments] = useState([]);
    const [prescriptionList, setPrescriptionList] = useState([]); // Reçetedeki ilaçlar
    const [medicineInput, setMedicineInput] = useState('');      // İlaç arama inputu
    const [currentDrug, setCurrentDrug] = useState("");
    const [dosage, setDosage] = useState("1x1");
    const [timing, setTiming] = useState("Tok");
    const [duration, setDuration] = useState("1 Hafta");
    const [leaveTab, setLeaveTab] = useState("pending");

const handleAddMedicine = () => {
    if (medicineInput.trim()) {
        // İlacı tüm detaylarıyla (Dozaj - Zamanlama - Süre) birleştiriyoruz
        const fullMed = `${medicineInput.trim()} (${dosage} - ${timing} - ${duration})`;
        setPrescriptionList([...prescriptionList, fullMed]);
        setMedicineInput("");
    }
};

const handleAddDrug = () => {
    if (currentDrug.trim()) {
        setPrescriptionList([...prescriptionList, currentDrug.trim()]);
        setCurrentDrug(""); // Inputu temizle
    }
};

const handleSaveAll = async () => {
    // İlaçları virgülle birleştirerek tek bir metin haline getiriyoruz
    const prescriptionString = prescriptionList.join(", ");

    try {
        await updateAppointment(selectedAppointment.id, {
            status: 'completed',
            note: doctorNote, // textarea'daki not
            prescription: prescriptionString // Yeni eklediğimiz alan
        });
        alert("Randevu ve Reçete başarıyla kaydedildi!");
    } catch (error) {
        console.error("Kaydetme hatası:", error);
    }
};


const handleRemoveMedicine = (index) => {
    setPrescriptionList(prescriptionList.filter((_, i) => i !== index));
};

// Modal kapandığında veya açıldığında reçeteyi temizlemek için
// closeModal fonksiyonunuzun içine şunu ekleyin:
const closeModal = () => {
    setSelectedAppointment(null);
    setPrescriptionList([]); // Reçeteyi sıfırla
    setMedicineInput('');
};
const handleDetailsClick = async (appointment) => {
    setSelectedAppointment(appointment);
    setDoctorNote(appointment.doctor_note || '');
    setPrescriptionList(appointment.prescription || []);
    setPatientDetails(null);
    setPatientHistory([]); // Önceki hastanın geçmişini temizle

    // Geçmişi çek
    fetchPatientHistory(appointment.tc_no);

    try {
        const response = await getPatientByTc(appointment.tc_no);
        setPatientDetails(response.data);
    } catch (error) {
        console.error("Hasta detayları çekilemedi:", error);
    }
};
const fetchAppointments = async () => {
    if (!doctorUserId) return;

    try {
        setLoading(true);

        const response = await getDoctorAppointments();
        const now = new Date();

        const processedAppointments = (response.data || []).map(app => {
            const now = new Date();
            const appointmentDateTime = new Date(`${app.appointment_date}T${app.time}:00`);
            const isPast = appointmentDateTime.getTime() < now.getTime() || app.status !== 'scheduled';

            return {
                ...app,
                patientName: `${app.patient_first_name || ''} ${app.patient_last_name || ''}`.trim() || 'Bilinmiyor',
                // Backend'den gelen randevu tipini burada açıkça alıyoruz
                appointmentType: app.appointmentType || "Muayene",
                isPast
            };
        });

        setAppointments(processedAppointments);

    } catch (error) {
        console.error("Randevular çekilemedi:", error);
        alert("Randevular yüklenirken bir hata oluştu.");
        setAppointments([]);
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
      // useEffect dışına, bileşenin içine al:
      const fetchLeaveDates = async () => {
          setLeaveLoading(true);
          try {
              const response = await getDoctorLeaveDates();
              const fetchedDates = response.data.leaveDates || [];
              setLeaveDates(fetchedDates);
          } catch (error) {
              console.error("İzinler çekilemedi:", error);
          } finally {
              setLeaveLoading(false);
          }
      };

      // useEffect içinde sadece çağır:
      useEffect(() => {
          if (doctorUserId) { fetchLeaveDates(); }
      }, [doctorUserId]);

      if (doctorUserId) {
          fetchLeaveDates();
      }
  }, [doctorUserId]);



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


    const handleAddLeave = async (dateString) => {
        if (!dateString) return;
        const today = getShortDate(new Date());
        if (dateString < today) { return alert("Geçmiş bir tarih için izin ekleyemezsiniz."); }

        // Daha önce eklenmiş veya bekleyen bir talep olup olmadığını kontrol et
        const alreadyExists = leaveDates.some(l => (l.date || l) === dateString);
        if (alreadyExists) { return alert("Bu tarih için zaten bir talebiniz veya onaylanmış izniniz bulunuyor."); }

        try {
            setLeaveLoading(true);

            // DİKKAT: Artık doğrudan profile değil, 'leave_requests' tablosuna kayıt atıyoruz
            // Backend'de bu isteği karşılayan bir route (Örn: /doctor/leave-request) olmalı
            await api.post('/doctor/leave-request', {
                startDate: dateString,
                endDate: dateString // Tek günlük izinler için başlangıç ve bitiş aynı
            });

            alert(`${formatDate(dateString)} tarihi için izin talebiniz yönetici onayına gönderildi.`);

            // Listeyi yenilemek için verileri tekrar çek (böylece 'Bekliyor' sekmesinde görünür)
            if (typeof fetchLeaveDates === 'function') {
                fetchLeaveDates();
            }
        } catch (error) {
            console.error("Talep gönderilirken hata:", error);
            alert(error.response?.data?.message || "Talep iletilemedi.");
        } finally {
            setLeaveLoading(false);
        }
    };

    // --- İZİN KALDIRMA FONKSİYONU GÜNCELLENDİ ---
    const handleRemoveLeave = async (dateString) => {
        const newLeaveDates = leaveDates.filter(date => date !== dateString);

        try {
            setLeaveLoading(true); // Yükleme durumunu başlat
            // API çağrısı ile veritabanına kaydet
            await updateDoctorLeaveDates(newLeaveDates);

            // Başarılı olursa state'i güncelle
            setLeaveDates(newLeaveDates);
            alert(`${formatDate(dateString)} için izin başarıyla kaldırıldı ve kaydedildi.`);
        } catch (error) {
            console.error("İzin kaldırılırken hata:", error);
            alert("İzin kaldırılırken bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLeaveLoading(false); // Yükleme durumunu bitir
        }
    };


    useEffect(() => {
        fetchAppointments();
    }, [doctorUserId]);

const [patientHistory, setPatientHistory] = useState([]);

// --- HASTA GEÇMİŞİNİ ÇEKME ---
const fetchPatientHistory = async (tcNo) => {
    try {
        const response = await api.get(`/appointments/patient/tc/${tcNo}`);
        const allApps = response.data || [];

        // İstersen şu anki randevuyu hariç tutabilirsin
        const history = allApps
            .filter(app => app.id !== selectedAppointment?.id)
            .sort(
                (a, b) =>
                    new Date(b.appointment_date) - new Date(a.appointment_date)
            );

        setPatientHistory(history);
    } catch (error) {
        console.error("Geçmiş randevular çekilemedi:", error);
    }
};

// handleAddMedicine ve handleRemoveMedicine zaten görselde var varsayıyorum.
// Asıl önemli olan kaydetme fonksiyonun:

const handleSaveDoctorReport = async () => {
    // 1. İlaç listesini virgülle ayrılmış bir metne dönüştür
    const prescriptionString = prescriptionList.join(", ");

    try {
        // Backend'deki updateAppointment fonksiyonuna gönderiyoruz
        await updateAppointment(app.id, {
            status: 'completed',
            note: doctorNote,           // textarea'daki içerik
            prescription: prescriptionString // Eklenen ilaçların birleşmiş hali
        });

        alert("Randevu başarıyla tamamlandı ve reçete kaydedildi.");
        // Listeyi yenilemek veya modalı kapatmak için gerekli kodlar...
    } catch (error) {
        console.error("Kayıt hatası:", error);
        alert("Kaydedilemedi, lütfen tekrar deneyin.");
    }
};

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






   // src/pages/DoctorPage.jsx (handleSaveNote fonksiyonunun GÜNCELLENMİŞ HALİ)

      const handleSaveNote = async () => {
          if (!selectedAppointment || !selectedAppointment.id) {
              alert("Hata: Randevu bulunamadı.");
              return;
          }

          if (!doctorNote || doctorNote.trim() === "") {
              alert("Kaydetmek için doktor notu alanı boş bırakılamaz.");
              return;
          }

          initializeAuthToken();
              const prescriptionText = prescriptionList.join(", "); // Metne çevirdik

         try {

                 await updateAppointmentStatus(
                     selectedAppointment.id,
                     'completed',
                     doctorNote.trim(),
                     prescriptionText
                 );

             const updatedData = {
                         status: 'completed',
                         doctor_note: doctorNote.trim(),
                         prescription: prescriptionText // Array değil, String!
                     };

              setAppointments(prev =>
                          prev.map(app => app.id === selectedAppointment.id ? { ...app, ...updatedData } : app)
                      );

                      setSelectedAppointment(prev => ({ ...prev, ...updatedData }));

                      alert("Başarıyla veritabanına kaydedildi.");
                  } catch (error) {
                      console.error("Hata:", error);
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

//hasta sorgup
 // DoctorPage.jsx içindeki fonksiyon
async function handleSearchTc(e) {
    if (e && e.preventDefault) e.preventDefault();

    // 1. Girdi kontrolü
    if (!searchTc || !searchTc.trim()) {
        setPatientError("Lütfen bir TC numarası giriniz.");
        setPatientInfo(null);
        setQueriedPatientAppointments([]);
        return;
    }

    const trimmed = searchTc.trim();

    try {
        setPatientError(null);
        setPatientInfo(null); // Yeni arama için eski veriyi temizle
        setQueriedPatientAppointments([]);

        // 2. Hasta temel bilgilerini getir
        // api.js içindeki getPatientByTc kullanılıyor
        const response = await getPatientByTc(trimmed);

        if (response.data) {
            setPatientInfo(response.data);

            // 3. Hasta bulunduysa geçmiş randevularını getir
            // api.js içindeki getPatientHistory kullanılıyor
            const historyRes = await getPatientHistory(trimmed);
            setQueriedPatientAppointments(historyRes.data || []);
        }

    } catch (error) {
        console.error("Veri çekme hatası:", error);

        // Backend'den dönen 404 hatasını yakala
        if (error.response && error.response.status === 404) {
            setPatientError("Sistemde bu TC numarasına kayıtlı bir hasta bulunamadı.");
        } else {
            setPatientError("Bilgiler çekilemedi. Lütfen bağlantınızı veya oturumunuzu kontrol edin.");
        }

        setPatientInfo(null);
        setQueriedPatientAppointments([]);
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



    // --- İSTATİSTİK HESAPLAMALARI (GÜVENLİ VE DOĞRU YER) ---
        const getStats = () => {
            if (!appointments || !Array.isArray(appointments)) {
                return { todayAppointments: 0, weeklyTotal: 0, completedTotal: 0 };
            }
            const todayStr = getShortDate(new Date());
            const weekStart = getStartOfWeek(new Date());
            const weekEnd = addDays(weekStart, 6);

            const todayAppointments = appointments.filter(a =>
                getShortDate(a.appointment_date) === todayStr && a.status === 'scheduled'
            ).length;

            const weeklyTotal = appointments.filter(a => {
                const d = new Date(a.appointment_date);
                return d >= weekStart && d <= weekEnd;
            }).length;

            const completedTotal = appointments.filter(a => a.status === 'completed').length;

            return { todayAppointments, weeklyTotal, completedTotal };
        };

        // Değişkeni burada tanımlıyoruz ki aşağıdaki return bloğu buna erişebilsin
        const stats = getStats();

    // --- RENDER HIZLI HASTA BİLGİ MODALI ---
        function renderQuickPatientInfoModal() {
            if (!quickPatientInfo) return null;

            const { name, loading, data, error } = quickPatientInfo;

const handleDetailsClick = async (appointment) => {
                        setSelectedAppointment(appointment);
                        setDoctorNote(appointment.doctor_note || '');
                        setPrescriptionList(appointment.prescription || []);
                        setPatientDetails(null);
                        setPatientHistory([]); // Önceki hastanın geçmişini temizle

                        // Geçmişi çek
                        fetchPatientHistory(appointment.tc_no);

                        try {
                            const response = await getPatientByTc(appointment.tc_no);
                            setPatientDetails(response.data);
                        } catch (error) {
                            console.error("Hasta detayları çekilemedi:", error);
                        }
                    };

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
function renderDoctorActionArea() {
    if (!selectedAppointment) return null;

    const isResultAppointment = selectedAppointment.appointmentType === "Sonuç";

    return (
        <div className="doctor-action-card">
            {/* HER İKİ DURUMDA DA GÖRÜNEN: Klinik Not Girişi */}
            <div className="form-field">
                <label>Klinik Notlar / Bulgular</label>
                <textarea
                    className="form-input"
                    value={doctorNote}
                    onChange={(e) => setDoctorNote(e.target.value)}
                    placeholder="Hastanın şikayetleri ve fiziksel muayene bulguları..."
                />
            </div>

            {/* --- DURUM A: MUAYENE RANDEVUSU --- */}
            {!isResultAppointment ? (
                <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #f2c94c', borderRadius: '10px' }}>
                    <h4 style={{ color: '#f39c12' }}>🩺 Muayene İstek Paneli</h4>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Lütfen hastadan istediğiniz tetkikleri seçin:</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                        <label><input type="checkbox" /> Kan Sayımı (Hemogram)</label>
                        <label><input type="checkbox" /> Biyokimya Paneli</label>
                        <label><input type="checkbox" /> Akciğer Grafisi (Röntgen)</label>
                        <label><input type="checkbox" /> Lomber MR</label>
                    </div>
                </div>
            ) : (
                /* --- DURUM B: SONUÇ RANDEVUSU --- */
                <div style={{ marginTop: '20px' }}>
                    <h4 style={{ color: '#27ae60' }}>💊 Reçete ve Rapor Paneli</h4>

                    {/* Reçete Girişi */}
                    <div className="form-field">
                        <label>Reçete Yaz (İlaçlar ve Kullanım)</label>
                        <textarea
                            className="form-input"
                            value={prescription}
                            onChange={(e) => setPrescription(e.target.value)}
                            placeholder="Örn: Parol 500mg 2x1, Tok karnına..."
                        />
                    </div>

                    {/* Radyolojik Rapor Girişi (Daha önce yazdığımız modül) */}
                    {renderRadiologyReporting()}
                </div>
            )}

            <button className="appointment-submit" style={{ marginTop: '20px' }}>
                {isResultAppointment ? "Süreci Tamamla ve Kaydet" : "Tetkikleri İste ve Notu Kaydet"}
            </button>
        </div>
    );
}
    // --- RENDER APPOINTMENT DETAY MODALI ---
    function renderAppointmentDetailModal() {
        if (!selectedAppointment) return null;

        const app = selectedAppointment;

        const isResultAppointment =
            (app.appointmentType && app.appointmentType.toString().toLowerCase() === "sonuç") ||
            (app.reason && app.reason.toLowerCase().includes("sonuç"));

        console.log("Seçilen Randevu Tipi (İşlenmiş):", isResultAppointment ? "Sonuç" : "Muayene");
        return (
            <div className="modal-backdrop">
                <div className="modal appointment-detail-modal" style={{ maxWidth: '800px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>{app.patientName} Randevu Detayları</h3>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            backgroundColor: isResultAppointment ? '#e8f4fd' : '#fff9db',
                            color: isResultAppointment ? '#2980b9' : '#f39c12',
                            border: `1px solid ${isResultAppointment ? '#3498db' : '#f2c94c'}`
                        }}>
                            {isResultAppointment ? "📋 SONUÇ RANDEVUSU" : "🩺 MUAYENE RANDEVUSU"}
                        </span>
                    </div>

                    {patientDetails ? (
                        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="detail-section" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                <h4 style={{ marginTop: 0 }}>📅 Randevu Bilgileri</h4>
                                <p><strong>Tarih:</strong> {new Date(app.appointment_date).toLocaleDateString()}</p>
                                <p><strong>Saat:</strong> {app.time}</p>
                                <p><strong>Şikayet:</strong> {app.reason}</p>
                            </div>
                            <div className="detail-section" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                <h4 style={{ marginTop: 0 }}>👤 Hasta Profili</h4>
                                <p><strong>TC No:</strong> {patientDetails.tc_no || 'Bilinmiyor'}</p>
                                <p><strong>Doğum Tarihi:</strong> {formatDate(patientDetails.date_of_birth) || 'Bilinmiyor'}</p>
                                <p><strong>Cinsiyet:</strong> {patientDetails.gender || 'Bilinmiyor'}</p>
                            </div>
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', margin: '20px 0' }}>Hasta detayları yükleniyor...</p>
                    )}

                    {/* --- ORTAK ALAN: DOKTOR NOTU --- */}
                    <div className="form-field full-width" style={{ marginTop: '20px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>✍️ Klinik Bulgular ve Muayene Notu</label>
                        <textarea
                            className="form-input"
                            rows="4"
                            value={doctorNote}
                            onChange={(e) => setDoctorNote(e.target.value)}
                            placeholder="Hastanın şikayetleri ve fiziksel muayene bulgularını giriniz..."
                        />
                    </div>

                    {/* --- KOŞULLU ALANLAR --- */}
                    {!isResultAppointment ? (
                        /* DURUM A: MUAYENE - TETKİK İSTEMİ */
                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fffdf5', border: '1px dashed #f2c94c', borderRadius: '8px' }}>
                            <h4 style={{ color: '#856404', marginTop: 0 }}>🔬 Tetkik İstemi (Laboratuvar & Radyoloji)</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <label style={{ cursor: 'pointer' }}><input type="checkbox" onChange={(e) => e.target.checked && setDoctorNote(prev => prev + "\n- Tam Kan Sayımı (Hemogram) istendi.")} /> Tam Kan Sayımı</label>
                                <label style={{ cursor: 'pointer' }}><input type="checkbox" onChange={(e) => e.target.checked && setDoctorNote(prev => prev + "\n- Biyokimya Paneli istendi.")} /> Biyokimya</label>
                                <label style={{ cursor: 'pointer' }}><input type="checkbox" onChange={(e) => e.target.checked && setDoctorNote(prev => prev + "\n- Akciğer Grafisi (Röntgen) istendi.")} /> Röntgen</label>
                                <label style={{ cursor: 'pointer' }}><input type="checkbox" onChange={(e) => e.target.checked && setDoctorNote(prev => prev + "\n- Bölgesel MR Görüntüleme istendi.")} /> MR / BT</label>
                            </div>
                        </div>
                    ) : (
                        /* DURUM B: SONUÇ - REÇETE VE RADYOLOJİ RAPORU */
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ padding: '15px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', marginBottom: '20px' }}>
                                <h4 style={{ color: '#0369a1', marginTop: 0 }}>💊 Reçete Düzenleme</h4>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ flex: 2 }}
                                        placeholder="İlaç adı..."
                                        value={medicineInput}
                                        onChange={(e) => setMedicineInput(e.target.value)}
                                    />
                                    <button type="button" onClick={handleAddMedicine} className="action-button action-success">Ekle</button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {prescriptionList.map((med, index) => (
                                        <span key={index} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '15px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {med} <button onClick={() => handleRemoveMedicine(index)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Radyoloji Rapor Modülü */}
                            {renderRadiologyReporting()}
                        </div>
                    )}

                    <div className="modal-actions" style={{ marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <button
                            onClick={() => generatePDFReport(app, patientDetails, profileData, prescriptionList)}
                            className="modal-button"
                            style={{ backgroundColor: '#28a745', color: 'white' }}
                        >
                            📄 Rapor & Reçete PDF
                        </button>
                        <button onClick={handleSaveNote} className="modal-button modal-save">
                            {isResultAppointment ? "Sonucu Kaydet" : "Muayeneyi Kaydet"}
                        </button>
                        <button onClick={closeModal} className="modal-button modal-cancel">Kapat</button>
                    </div>
                </div>
            </div>
        );
    }


    // --- YENİ BİLEŞEN: İZİN YÖNETİMİ ---
   function renderLeaveManagement() {
       // HATA: leaveRequests.filter(...) yazıyordu.
       // DÜZELTME: Mevcut state'in olan leaveDates kullanılmalı.
       const safeLeaves = Array.isArray(leaveDates) ? leaveDates : [];

       const filteredLeaves = safeLeaves.filter(req => {
           // req bazen sadece string (tarih) bazen obje olabilir, ikisini de kontrol et
           const status = req.status || 'approved'; // Eski sarı rozetler 'approved' sayılır
           return status.toLowerCase() === leaveTab.toLowerCase();
       });

       return (
           <div style={{ maxWidth: '850px', margin: '0 auto', padding: '20px', animation: 'fadeIn 0.5s ease' }}>
               {/* ÜST BAŞLIK */}
               <div style={{ marginBottom: '30px', borderBottom: '2px solid #f0f2f5', paddingBottom: '15px' }}>
                   <h1 style={{ fontSize: "26px", fontWeight: '800', color: '#2c3e50', margin: 0 }}>
                       İzin ve Takvim Yönetimi
                   </h1>
                   <p style={{ margin: '5px 0 0', color: '#7f8c8d', fontSize: '1rem' }}>
                       Çalışma takviminizi planlayın ve izin taleplerinizi takip edin.
                   </p>
               </div>

               {/* İZİN EKLEME FORMU (Hızlı İşlem) */}
               <div className="card" style={{ padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #f0f2f5' }}>
                   <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', color: '#34495e' }}>➕ Yeni İzin Talebi Oluştur</h3>
                   <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                       <div style={{ flex: 1 }}>
                           <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555', fontSize: '0.85rem' }}>İzin Tarihi</label>
                           <input
                               type="date"
                               className="form-input"
                               style={{ width: '100%', borderRadius: '12px' }}
                               value={leaveDateInput}
                               onChange={(e) => setLeaveDateInput(e.target.value)}
                               min={getShortDate(new Date())}
                           />
                       </div>
                       <button
                           onClick={() => { if(leaveDateInput) handleAddLeave(leaveDateInput); setLeaveDateInput(''); }}
                           className="appointment-submit"
                           style={{ height: '48px', marginTop: 0, padding: '0 30px', borderRadius: '12px', backgroundColor: '#f39c12' }}
                           disabled={!leaveDateInput}
                       >
                           Talebi Gönder
                       </button>
                   </div>
               </div>

               {/* SEKMELER (Tabs) */}
               <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', background: '#f8f9fa', padding: '10px', borderRadius: '15px', width: 'fit-content' }}>
                   {[
                       { id: 'pending', label: '⏳ Bekleyenler', color: '#f39c12' },
                       { id: 'approved', label: '✅ Onaylananlar', color: '#27ae60' },
                       { id: 'rejected', label: '❌ Reddedilenler', color: '#e74c3c' }
                   ].map(tab => (
                       <button
                           key={tab.id}
                           onClick={() => setLeaveTab(tab.id)}
                           style={{
                               padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.3s ease',
                               backgroundColor: leaveTab === tab.id ? tab.color : 'transparent',
                               color: leaveTab === tab.id ? 'white' : '#7f8c8d'
                           }}
                       >
                           {tab.label}
                       </button>
                   ))}
               </div>

               {/* İZİN LİSTESİ (Kart Tasarımı) */}
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                   {filteredLeaves.length > 0 ? (
                       filteredLeaves.map((leave, index) => (
                           <div key={index} style={{
                               background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #f0f2f5',
                               borderLeft: `6px solid ${leaveTab === 'approved' ? '#27ae60' : leaveTab === 'rejected' ? '#e74c3c' : '#f39c12'}`,
                               boxShadow: '0 8px 20px rgba(0,0,0,0.03)', position: 'relative'
                           }}>
                               <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#2c3e50', marginBottom: '5px' }}>
                                   {formatDate(leave.date || leave)}
                               </div>
                               <div style={{ color: '#95a5a6', fontSize: '0.85rem', marginBottom: '15px', textTransform: 'capitalize' }}>
                                   {new Date(leave.date || leave).toLocaleDateString('tr-TR', { weekday: 'long' })}
                               </div>

                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                   <span style={{
                                       fontSize: '0.75rem', fontWeight: '800', padding: '5px 12px', borderRadius: '12px',
                                       backgroundColor: leaveTab === 'approved' ? '#eafaf1' : leaveTab === 'rejected' ? '#fdf2f2' : '#fff9eb',
                                       color: leaveTab === 'approved' ? '#27ae60' : leaveTab === 'rejected' ? '#e74c3c' : '#f39c12'
                                   }}>
                                       {leaveTab === 'approved' ? 'ONAYLANDI' : leaveTab === 'rejected' ? 'REDDEDİLDİ' : 'BEKLİYOR'}
                                   </span>

                                   {leaveTab === 'pending' && (
                                       <button
                                           onClick={() => handleRemoveLeave(leave.date || leave)}
                                           style={{ background: 'none', border: 'none', color: '#95a5a6', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                                       >
                                           İptal Et
                                       </button>
                                   )}
                               </div>
                           </div>
                       ))
                   ) : (
                       <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                           <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🏜️</div>
                           <p style={{ color: '#94a3b8', fontWeight: '500' }}>Bu kategoride herhangi bir kayıt bulunmuyor.</p>
                       </div>
                   )}
               </div>
           </div>
       );
   }

    // ---------------------------------------------------------------------
    // --- PROFİL YÖNETİMİ BİLEŞENLERİ (Görüntüleme/Düzenleme Geçişi) ---
    // ---------------------------------------------------------------------
// --- PROFİL BİLGİLERİNİ BACKEND'DEN ÇEK (ZORUNLU) ---
// DoctorPage.jsx içindeki useEffect
// DoctorPage.jsx içindeki useEffect
useEffect(() => {
    async function fetchDoctorProfile() {
        try {
            setProfileLoading(true);
            const response = await getDoctorProfile();
            const data = response.data; // Konsoldaki o obje burası

            setProfileData(prev => ({
                ...prev,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                specialization: data.specialization || 'Belirtilmedi',
                title: data.title || 'Dr.',
                education: data.education || [],
                newPassword: '',
                confirmNewPassword: ''
            }));

        } catch (error) {
            console.error("Doktor profili alınamadı:", error);
        } finally {
            setProfileLoading(false);
        }
    }
    fetchDoctorProfile();
}, []);
function renderRadiologyReporting() {
    return (
        <div className="card" style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>📝</span> Radyoloji Rapor Girişi
            </h2>

            <form style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-field">
                        <label>Tetkik Türü</label>
                        <select className="form-input">
                            <option value="MR">MR (Emar)</option>
                            <option value="X-RAY">Röntgen (X-Ray)</option>
                            <option value="CT">Tomografi (BT)</option>
                            <option value="USG">Ultrason (USG)</option>
                        </select>
                    </div>
                    <div className="form-field">
                        <label>Tetkik Bölgesi</label>
                        <input type="text" className="form-input" placeholder="Örn: Lomber Spinal, Akciğer PA vb." />
                    </div>
                </div>

                <div className="form-field">
                    <label>Klinik Bulgular ve Rapor Detayı</label>
                    <textarea
                        className="form-input"
                        rows="6"
                        placeholder="Radyolojik bulguları detaylıca buraya yazınız..."
                        style={{ resize: 'vertical' }}
                    ></textarea>
                </div>

                <div className="form-field">
                    <label>Sonuç / Kanı</label>
                    <input type="text" className="form-input" placeholder="Özet sonuç cümlesini giriniz..." />
                </div>

                <div style={{
                    padding: '15px',
                    backgroundColor: '#fffcf0',
                    border: '1px dashed #f2c94c',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>🖼️</span>
                    <div style={{ fontSize: '0.85rem', color: '#856404' }}>
                        <strong>Görüntü Ekleme:</strong> Görüntü dosyaları (DICOM/JPG) PACS sisteminden otomatik olarak eşleşecektir.
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="button" className="appointment-submit" style={{ flex: 2, backgroundColor: '#2ecc71', color: '#fff' }}>
                        ✅ Raporu Onayla ve Yayınla
                    </button>
                    <button type="button" className="btn-secondary" style={{ flex: 1 }}>
                        Taslak Olarak Kaydet
                    </button>
                </div>
            </form>
        </div>
    );
}
    // --- 1. RENDER PROFİL GÖRÜNTÜLEME MODU (DÜZELTİLDİ) ---
   function renderProfileView() {
       // Kurumsal Sarı Renk Paleti
       const primaryYellow = '#f1c40f'; // Daha canlı bir sarı
       const hoverYellow = '#f39c12';

       return (
           <div style={{ maxWidth: '850px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
               {/* ÜST BAŞLIK ALANI */}
               <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                   <div style={{
                       width: '70px', height: '70px', backgroundColor: primaryYellow, borderRadius: '50%',
                       display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                       boxShadow: `0 4px 15px rgba(241, 196, 15, 0.3)`
                   }}>👤</div>
                   <div>
                       <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#2c3e50' }}>Profil Bilgileri</h1>
                       <p style={{ margin: 0, color: '#7f8c8d' }}>Kurumsal kimlik ve hesap detaylarınız</p>
                   </div>
               </div>

               {/* ANA PROFİL KARTI */}
               <div className="card" style={{
                   padding: '35px', borderRadius: '20px', border: '1px solid #f0f2f5',
                   boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'relative', marginBottom: '25px'
               }}>
                   {/* Sarı Vurgu Çizgisi */}
                   <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', backgroundColor: primaryYellow }}></div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                       <div>
                           <label style={pLabelStyle}>AD SOYAD</label>
                           <div style={pValueStyle}>{profileData.firstName} {profileData.lastName}</div>
                       </div>
                       <div>
                           <label style={pLabelStyle}>E-POSTA ADRESİ 📧</label>
                           <div style={pValueStyle}>{profileData.email}</div>
                       </div>
                       <div>
                           <label style={pLabelStyle}>AKADEMİK UNVAN 🎓</label>
                           <div style={pValueStyle}> {profileData.title}</div>
                       </div>
                       <div>
                           <label style={pLabelStyle}>UZMANLIK ALANI</label>
                           <div style={pValueStyle}> {profileData.specialization}</div>
                       </div>
                   </div>

                   <button
                       onClick={() => { setIsEditingProfile(true); setProfileMessage({ type: '', text: '' }); }}
                       style={{
                           ...pButtonStyle,
                           backgroundColor: primaryYellow,
                           boxShadow: `0 4px 15px rgba(241, 196, 15, 0.3)`,
                           color: '#2c3e50' // Koyu metin sarı üzerinde daha iyi okunur
                       }}
                   >
                       ⚙️ Bilgileri Güncelle
                   </button>
               </div>

               {/* YENİ: EĞİTİM BİLGİLERİ KARTU */}
              {/* DoctorPage.jsx içindeki Eğitim Kartı Bölümü */}
           {/* DoctorPage.jsx içindeki "EĞİTİM BİLGİLERİ KARTU" bölümünü bu kodla değiştirin */}
           <div className="card" style={{ padding: '30px', borderRadius: '20px', border: '1px solid #f0f2f5', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'relative' }}>
               <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', backgroundColor: '#34495e' }}></div>
               <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   📚 Eğitim ve Akademik Geçmiş
               </h3>
              {/* DoctorPage.jsx içindeki eğitim bölümünü bu kodla değiştir */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {profileData.education &&
                   (Array.isArray(profileData.education) ? profileData.education.length > 0 : profileData.education.trim() !== "") ? (

                      // Veri diziyse direkt kullan, string ise böl
                      (Array.isArray(profileData.education)
                          ? profileData.education
                          : profileData.education.split('\n')
                      )
                      .filter(line => line && line.toString().trim() !== "")
                      .map((edu, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                              <div style={{ width: '10px', height: '10px', backgroundColor: '#f1c40f', borderRadius: '50%', marginTop: '6px' }}></div>
                              <div style={{ fontWeight: '600', color: '#2c3e50' }}>{edu}</div>
                          </div>
                      ))
                  ) : (
                      <p style={{ color: '#95a5a6', fontStyle: 'italic' }}>Henüz akademik geçmiş bilgisi girilmemiştir.</p>
                  )}
              </div>
           </div>
                  </div>
       );
   }

    function renderProfileEdit() {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
                <h1 style={{ fontSize: "26px", fontWeight: '800', marginBottom: "25px", color: '#2c3e50' }}>
                    ✍️ Hesap Ayarlarını Düzenle
                </h1>

                <div className="card" style={{ padding: '35px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <form onSubmit={handleProfileSubmit}>
                        <h3 style={{ marginTop: 0, marginBottom: '25px', color: '#34495e', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            Kişisel Bilgiler
                        </h3>

                        {profileMessage.text && (
                            <div style={{
                                padding: '12px', borderRadius: '8px', marginBottom: '20px',
                                backgroundColor: profileMessage.type === 'error' ? '#fff5f5' : '#f0fff4',
                                color: profileMessage.type === 'error' ? '#e74c3c' : '#27ae60',
                                border: `1px solid ${profileMessage.type === 'error' ? '#feb2b2' : '#9ae6b4'}`
                            }}>
                                {profileMessage.type === 'error' ? '❌ ' : '✅ '} {profileMessage.text}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label style={fLabelStyle}>Ad</label>
                                <input type="text" name="firstName" style={fInputStyle} value={profileData.firstName} onChange={handleProfileChange} required />
                            </div>
                            <div className="form-group">
                                <label style={fLabelStyle}>Soyad</label>
                                <input type="text" name="lastName" style={fInputStyle} value={profileData.lastName} onChange={handleProfileChange} required />
                            </div>
                            <div className="form-group">
                                <label style={fLabelStyle}>E-posta</label>
                                <input type="email" name="email" style={fInputStyle} value={profileData.email} onChange={handleProfileChange} required />
                            </div>
                            <div className="form-group">
                                <label style={fLabelStyle}>Unvan (Sabit)</label>
                                <input type="text" style={{...fInputStyle, backgroundColor: '#f8f9fa', cursor: 'not-allowed'}} value={profileData.title} disabled />
                            </div>
                        </div>

                        <h3 style={{ marginTop: '40px', marginBottom: '20px', color: '#34495e', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            Güvenlik Ayarları
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                             <div className="form-group">
                                <label style={fLabelStyle}>Yeni Şifre</label>
                                <input type="password" name="newPassword" style={fInputStyle} value={profileData.newPassword} onChange={handleProfileChange} placeholder="••••••••" />
                            </div>
                            <div className="form-group">
                                <label style={fLabelStyle}>Yeni Şifre (Tekrar)</label>
                                <input type="password" name="confirmNewPassword" style={fInputStyle} value={profileData.confirmNewPassword} onChange={handleProfileChange} placeholder="••••••••" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '40px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setIsEditingProfile(false)} style={cancelButtonStyle}>
                                İptal Et
                            </button>
                            <button type="submit" disabled={profileLoading} style={saveButtonStyle}>
                                {profileLoading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
const pLabelStyle = { fontSize: '0.7rem', fontWeight: '800', color: '#bdc3c7', letterSpacing: '1px', marginBottom: '5px', display: 'block' };
const pValueStyle = { fontSize: '1.1rem', fontWeight: '600', color: '#34495e', display: 'flex', alignItems: 'center' };
const pButtonStyle = { marginTop: '30px', padding: '12px 25px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(243, 156, 18, 0.2)' };

const fLabelStyle = { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555', fontSize: '0.85rem' };
const fInputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #edf2f7', outline: 'none' };

const saveButtonStyle = { padding: '12px 30px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' };
const cancelButtonStyle = { padding: '12px 30px', backgroundColor: '#ecf0f1', color: '#7f8c8d', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' };
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
        {renderAppointmentDetailModal && renderAppointmentDetailModal()}
        {renderQuickPatientInfoModal && renderQuickPatientInfoModal()}

        {/* SOL: SIDEBAR */}
        <aside className={`app-sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <div>
            <h2 className="app-sidebar-title">Cankaya Hospital</h2>

            {/* SIDEBAR DARALT BUTONU */}
            <button
              className="sidebar-toggle"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? "➡️" : "⬅️"}
            </button>

            {/* DOKTOR PROFİL ALANI */}
            <div className="doctor-sidebar-profile">
              <div className="doctor-avatar">
                {profileData ? (
                  profileData.firstName?.charAt(0) + profileData.lastName?.charAt(0)
                ) : null}
              </div>

              {!isSidebarCollapsed && profileData && (
                <div className="doctor-info">
                  <div className="doctor-name">
                    {profileData.title} {profileData.firstName} {profileData.lastName}
                  </div>
                  <div className="doctor-branch">
                    {profileData.specialization}
                  </div>
                </div>
              )}
            </div>

            {/* MENÜ BUTONLARI */}
            <div className="sidebar-buttons">
              <button
                className={sectionButtonClass("panel")}
                onClick={() => setActiveSection("panel")}
              >
                Randevular
              </button>

              <button
                className={sectionButtonClass("calendar")}
                onClick={() => setActiveSection("calendar")}
                style={{ marginTop: "8px" }}
              >
                Çalışma Takvimi
              </button>

              <button
                className={sectionButtonClass("leave")}
                onClick={() => setActiveSection("leave")}
                style={{ marginTop: "8px" }}
              >
                İzin Yönetimi
              </button>

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
                  <button type="submit" className="search-button">Ara</button>
                </form>
              )}

              <button
                className={sectionButtonClass("profile")}
                onClick={() => { setActiveSection("profile"); setIsEditingProfile(false); }}
                style={{ marginTop: "8px" }}
              >
                Profil/Hesap Ayarları
              </button>



              <button onClick={onLogout} className="logout-button">
                Çıkış
              </button>
            </div>
          </div>
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
                      <div style={{ marginTop: "20px" }}>
                          {/* 1. Hasta Temel Bilgileri Tablosu */}
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

                            <div className="card" style={{ marginTop: '25px', borderTop: '4px solid #3498db' }}>
                              <h3 style={{ color: '#2c3e50', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  📜 Kapsamlı Tıbbi Geçmiş
                              </h3>

                              {queriedPatientAppointments.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                      {queriedPatientAppointments.map((record, idx) => (
                                          <div key={idx} style={{
                                              padding: '15px',
                                              borderRadius: '10px',
                                              border: '1px solid #eef2f3',
                                              background: record.status === 'completed' ? '#fff' : '#fcfcfc',
                                              boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                                          }}>
                                              {/* 1. Üst Bilgi: Tarih ve Tür */}
                                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                  <span style={{ fontWeight: 'bold', color: '#34495e' }}>
                                                      📅 {new Date(record.appointment_date).toLocaleDateString('tr-TR')}
                                                  </span>
                                                  <span style={{
                                                      fontSize: '0.75rem',
                                                      padding: '3px 10px',
                                                      borderRadius: '12px',
                                                      backgroundColor: record.appointmentType === 'Sonuç' ? '#e1f5fe' : '#fff9c4',
                                                      color: record.appointmentType === 'Sonuç' ? '#01579b' : '#f57f17'
                                                  }}>
                                                      {record.appointmentType || 'Muayene'}
                                                  </span>
                                              </div>

                                              {/* 2. Doktor Bilgisi */}
                                              <div style={{ marginBottom: '8px' }}>
                                                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2980b9' }}>
                                                      👨‍⚕️ {record.doctor_title} {record.doctor_first_name} {record.doctor_last_name}
                                                  </span>
                                                  <small style={{ color: '#95a5a6', marginLeft: '8px' }}>
                                                      ({record.doctor_branch})
                                                  </small>
                                              </div>

                                              {/* 3. Tanı ve Klinik Notlar */}
                                              <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                                                  <strong>🩺 Tanı ve Bulgular:</strong>
                                                  <p style={{ margin: '5px 0', fontStyle: 'italic', color: '#7f8c8d' }}>
                                                      {record.note || "Tanı girişi yapılmamış."}
                                                  </p>
                                              </div>

                                              {/* 4. Reçete (Eğer varsa) */}
                                              {record.prescription && (
                                                  <div style={{ marginBottom: '15px', padding: '10px', borderLeft: '3px solid #27ae60', backgroundColor: '#fafffa' }}>
                                                      <strong style={{ color: '#27ae60' }}>💊 Reçete / İlaçlar:</strong>
                                                      <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{record.prescription}</p>
                                                  </div>
                                              )}

                                              {/* 5. YENİ: TAHLİL VE RADYOLOJİ BUTONLARI */}
                                              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid #f1f1f1', paddingTop: '10px' }}>

                                                  {/* Tahlil Butonu - record.lab_report_url gibi bir kolonun olduğunu varsayıyoruz */}
                                                  <button
                                                      onClick={() => record.lab_report_url ? window.open(record.lab_report_url) : alert('Bu randevuya ait tahlil sonucu bulunamadı.')}
                                                      style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', backgroundColor: '#ebf5ff', border: '1px solid #3498db', color: '#3498db', borderRadius: '5px' }}
                                                  >
                                                      🧪 Tahlil Sonuçları
                                                  </button>

                                                  {/* Radyoloji Butonu - record.radiology_url gibi bir kolonun olduğunu varsayıyoruz */}
                                                  <button
                                                      onClick={() => record.radiology_url ? window.open(record.radiology_url) : alert('Görüntüleme kaydı (MR/Röntgen) bulunamadı.')}
                                                      style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', backgroundColor: '#fff5f5', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '5px' }}
                                                  >
                                                      🖼 Radyolojik Görüntü
                                                  </button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <p style={{ textAlign: 'center', color: '#95a5a6', padding: '20px' }}>
                                      Hastaya ait geçmiş tıbbi kayıt bulunamadı.
                                  </p>
                              )}
                          </div>
                      </div> // patientInfo içeriğini kapatan div
                  )}
              </div> // Ana card'ı kapatan div
          )}



          {/* --- DOKTOR PANELİ: RANDEVULAR --- */}
          {activeSection === "panel" && (
            <>
              <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>
                Randevular
              </h1>
{stats && (

                      <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '20px',
                          marginBottom: '25px'
                      }}>
                          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #007bff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                              <h4 style={{ margin: 0, fontSize: '13px', color: '#6b7280', textTransform: 'uppercase' }}>Bugün Bekleyen</h4>
                              <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '10px', color: '#1f2937' }}>{stats.todayAppointments}</div>
                          </div>

                          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                              <h4 style={{ margin: 0, fontSize: '13px', color: '#6b7280', textTransform: 'uppercase' }}>Bu Haftaki Toplam</h4>
                              <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '10px', color: '#1f2937' }}>{stats.weeklyTotal}</div>
                          </div>

                          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #f59e0b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                              <h4 style={{ margin: 0, fontSize: '13px', color: '#6b7280', textTransform: 'uppercase' }}>Tamamlanan Randevular</h4>
                              <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '10px', color: '#1f2937' }}>{stats.completedTotal}</div>
                          </div>
                      </div>
                      )}

              <div className="card">
                {/* Filtreleme Arayüzü */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
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
                              onClick={(e) => { e.preventDefault(); handleQuickPatientInfoClick(a.tc_no, a.patientName); }}
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

                            {a.status === 'scheduled' && (
                              <>
                                <button
                                  type="button"
                                  className="action-button action-success"
                                  onClick={() => handleUpdateAppointment(a.id, 'completed', a.doctor_note)}
                                  style={{ marginRight: '5px' }}
                                >
                                  Tamamla
                                </button>
                                <button
                                  type="button"
                                  className="action-button action-danger"
                                  onClick={() => handleUpdateAppointment(a.id, 'canceled', a.doctor_note)}
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
          {activeSection === "calendar" && renderWorkCalendar && renderWorkCalendar()}

          {/* --- İZİN YÖNETİMİ --- */}
          {activeSection === "leave" && renderLeaveManagement && renderLeaveManagement()}

          {/* --- PROFİL AYARLARI --- */}
          {activeSection === "profile" && renderProfileManagement && renderProfileManagement()}

        </main>
      </div>
    );
}