import pool from '../db.js';

// --- Yardımcı Fonksiyonlar ---
const getPatientId = async (userId) => {
    const [result] = await pool.execute(
        'SELECT id FROM patients WHERE user_id = ?',
        [userId]
    );
    return result[0] ? result[0].id : null;
};

const getDoctorId = async (userId) => {
    const [result] = await pool.execute(
        'SELECT id FROM doctors WHERE user_id = ?',
        [userId]
    );
    return result[0] ? result[0].id : null;
};
// --- Yardımcı Fonksiyonlar Sonu ---


// 1. Randevu Oluşturma (POST /api/appointments)
export const createAppointment = async (req, res) => {
    const patientUserId = req.user.id;
    const { doctorId, appointmentDate, reason } = req.body;

    try {
        const patientId = await getPatientId(patientUserId);

        if (!patientId) {
            return res.status(404).send('Hasta kaydı bulunamadı.');
        }

        if (new Date(appointmentDate) < new Date()) {
            return res.status(400).send('Randevu tarihi geçmiş bir tarih olamaz.');
        }

        const [result] = await pool.execute(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status) VALUES (?, ?, ?, ?, ?)',
            [patientId, doctorId, appointmentDate, reason, 'scheduled']
        );

        res.status(201).json({
            message: 'Randevu başarıyla oluşturuldu.',
            appointmentId: result.insertId
        });

    } catch (error) {
        console.error('Randevu oluşturma hatası:', error);
        res.status(500).send('Sunucu hatası: Randevu oluşturulamadı.');
    }
};


// 2. Hastanın Randevu Geçmişini Çekme (GET /api/appointments/patient)
export const getPatientAppointments = async (req, res) => {
    const patientUserId = req.user.id;

    try {
        const patientId = await getPatientId(patientUserId);

        if (!patientId) {
            return res.status(200).json([]);
        }

        const [appointments] = await pool.execute(
            `SELECT
                a.id,
                a.appointment_date,
                a.reason,
                a.status,
                a.doctor_note,
                d.first_name AS doctor_first_name,
                d.last_name AS doctor_last_name,
                d.specialization
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC`,
            [patientId]
        );

        res.status(200).json(appointments);

    } catch (error) {
        console.error('Hasta randevu geçmişi çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};


// 3. Doktorun Güncel Randevularını Çekme (GET /api/appointments/doctor)
export const getDoctorAppointments = async (req, res) => {
    const doctorUserId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    try {
        const doctorId = await getDoctorId(doctorUserId);

        if (!doctorId) {
            return res.status(404).send('Doktor kaydı bulunamadı.');
        }

        const [appointments] = await pool.execute(
            `SELECT
                a.id,
                a.appointment_date,
                a.reason,
                a.status,
                a.doctor_note,
                p.first_name AS patient_first_name,
                p.last_name AS patient_last_name,
                p.tc_no,
                p.id AS patient_id
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            WHERE a.doctor_id = ?
              AND a.status = 'scheduled'
              AND DATE(a.appointment_date) >= ?
            ORDER BY a.appointment_date ASC`,
            [doctorId, today]
        );

        res.status(200).json(appointments);

    } catch (error) {
        console.error('Doktor randevu listesi çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};


// 4. Randevu Durumunu / Doktor Notunu Güncelleme (PATCH /api/appointments/:id)
export const updateAppointment = async (req, res) => {
    const appointmentId = req.params.id;
    const { status, note } = req.body;

    try {
        if (status === 'completed' && note !== undefined) {
            await pool.execute(
                'UPDATE appointments SET status = ?, doctor_note = ? WHERE id = ?',
                ['completed', note, appointmentId]
            );
        } 
        else if (status === 'canceled') {
            await pool.execute(
                'UPDATE appointments SET status = ? WHERE id = ?',
                ['canceled', appointmentId]
            );
        } 
        else {
            return res.status(400).send('Geçersiz durum veya eksik not.');
        }

        res.status(200).send('Randevu başarıyla güncellendi.');

    } catch (error) {
        console.error('Randevu güncelleme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};
