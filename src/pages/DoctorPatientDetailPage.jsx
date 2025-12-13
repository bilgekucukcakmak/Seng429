import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';

const DoctorPatientDetailPage = () => {
    const { id } = useParams(); // patient_id
    const [searchParams] = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');

    const [patient, setPatient] = useState(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                const res = await api.get(`/patients/${id}`);
                setPatient(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPatient();
    }, [id]);

    const saveNote = async () => {
        try {
            await api.patch(`/appointments/${appointmentId}`, {
                status: 'completed',
                note
            });
            alert('Doktor notu kaydedildi');
        } catch (err) {
            alert('Not kaydedilemedi');
        }
    };

    if (loading) return <p>Yükleniyor...</p>;

    return (
        <div>
            <h2>Hasta Bilgileri</h2>

            <p><b>Ad Soyad:</b> {patient.first_name} {patient.last_name}</p>
            <p><b>TC:</b> {patient.tc_no}</p>
            <p><b>Doğum Tarihi:</b> {patient.birth_date}</p>
            <p><b>Cinsiyet:</b> {patient.gender}</p>
            <p><b>Telefon:</b> {patient.phone}</p>
            <p><b>Email:</b> {patient.email}</p>
            <p><b>Adres:</b> {patient.address}</p>

            <hr />

            <h3>Doktor Notu</h3>
            <textarea
                rows={5}
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />

            <br />

            <button onClick={saveNote}>Notu Kaydet</button>
        </div>
    );
};

export default DoctorPatientDetailPage;
