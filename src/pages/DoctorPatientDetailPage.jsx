import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';

const DoctorPatientDetailPage = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [appointment, setAppointment] = useState(null); // Randevu detayları için
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // 1. Hasta Bilgilerini Getir
                const patientRes = await api.get(`/patients/${id}`);
                setPatient(patientRes.data);

                // 2. Randevu Bilgilerini Getir (Tipini öğrenmek için şart)
                const appRes = await api.get(`/appointments/${appointmentId}`);
                setAppointment(appRes.data);
                setNote(appRes.data.doctor_note || '');
            } catch (err) {
                console.error("Veri çekme hatası:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id && appointmentId) fetchAllData();
    }, [id, appointmentId]);

    const isResult = appointment?.appointmentType?.toLowerCase() === 'sonuç';

    const saveAll = async () => {
        try {
            await api.patch(`/appointments/${appointmentId}`, {
                status: 'completed',
                note: note,
                // Eğer sonuç randevusuysa ek verileri de gönderebilirsin
            });
            alert('Bilgiler başarıyla kaydedildi');
            navigate('/doctor'); // Kayıt sonrası ana panele dön
        } catch (err) {
            alert('Kaydedilemedi');
        }
    };

    if (loading) return <p>Yükleniyor...</p>;
    if (!patient) return <p>Hasta bulunamadı.</p>;

    return (
        <div className="card" style={{ padding: '20px' }}>
            {/* Üst Bilgi Çubuğu */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <h2>Hasta Detayları</h2>
                <span className={`status-badge ${isResult ? 'status-muayene' : 'status-bekliyor'}`}>
                    {isResult ? "📋 SONUÇ" : "🩺 MUAYENE"}
                </span>
            </div>

            {/* Hasta Kartı */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <p><b>Ad Soyad:</b> {patient.first_name} {patient.last_name}</p>
                <p><b>TC:</b> {patient.tc_no}</p>
                {/* Diğer bilgiler... */}
            </div>

            <hr />

            {/* DİNAMİK ALAN */}
            <h3>Doktor İşlemleri</h3>
            <textarea
                className="form-input"
                rows={5}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Klinik notları buraya girin..."
            />

            {isResult ? (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                    <h4>💊 Reçete ve Rapor Paneli</h4>
                    <p>Bu alan sonuç randevusu olduğu için aktif edildi.</p>
                    {/* Buraya Reçete bileşenini ekleyebilirsin */}
                </div>
            ) : (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff9c4', borderRadius: '8px' }}>
                    <h4>🔬 Tetkik İstemi</h4>
                    <p>Muayene bulgularına göre tahlil isteyebilirsiniz.</p>
                </div>
            )}

            <button className="appointment-submit" onClick={saveAll} style={{ marginTop: '20px' }}>
                Kaydet ve Kapat
            </button>
        </div>
    );
};