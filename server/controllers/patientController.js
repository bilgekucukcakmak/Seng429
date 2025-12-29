import pool from '../db.js';

// --- Yardımcı Fonksiyon ---
const getPatientIdFromUser = async (userId) => {
    const [result] = await pool.execute(
        'SELECT id FROM patients WHERE user_id = ?',
        [userId]
    );
    return result[0] ? result[0].id : null;
};


// server/controllers/patientController.js
export const getPatientAppointmentsByTc = async (req, res) => {
    const { tcNo } = req.params;
    try {
        const [appointments] = await pool.execute(
            `SELECT
                a.*,
                p.first_name AS patient_first_name,
                p.last_name AS patient_last_name,
                d.first_name AS doctor_first_name,
                d.last_name AS doctor_last_name,
                d.specialization AS doctor_branch,
                d.title AS doctor_title
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             LEFT JOIN doctors d ON a.doctor_id = d.id
             WHERE p.tc_no = ?
             ORDER BY a.appointment_date DESC`,
            [tcNo]
        );
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).send('Veritabanı hatası: ' + error.message);
    }
};

// 2. Hastanın Kendi Profili
export const getPatientProfile = async (req, res) => {
    const userId = req.user.id; // ensureAuthenticated'den gelen ID
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM patients WHERE user_id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profil bulunamadı' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// server/controllers/patientController.js içinde olması gereken hali:

export const createAppointment = async (req, res) => {
    const userId = req.user.id;
    const { doctorId, appointmentDate, time, reason, appointmentType } = req.body;

    try {
        const patientId = await getPatientIdFromUser(userId);
        if (!patientId) return res.status(404).send('Hasta bulunamadı.');

        // SQL sorgusunda 'time' sütununun olduğundan ve
        // dışarıdan gelen 'time' değişkeninin buraya bağlandığından emin olun
        const query = `
            INSERT INTO appointments (patient_id, doctor_id, appointment_date, time, reason, status, type)
            VALUES (?, ?, ?, ?, ?, 'scheduled', ?)
        `;

        await pool.execute(query, [patientId, doctorId, appointmentDate, time, reason, appointmentType]);
        res.status(201).send('Randevu oluşturuldu.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Hata!');
    }
};

// server/controllers/appointmentController.js


// 3. Hastanın Kendi Profilini Güncellemesi
export const updatePatientProfile = async (req, res) => {
    const userId = req.user.id;
    const {
        tc_no, date_of_birth, blood_type, gender,
        height, weight, allergies, diseases, phone_number
    } = req.body;

    try {
        const patientId = await getPatientIdFromUser(userId);

        if (!patientId) {
            return res.status(404).send('Hasta profili bulunamadı.');
        }

        const formattedDate = date_of_birth
            ? date_of_birth.split('T')[0]
            : null;

        await pool.execute(
            `UPDATE patients SET
                tc_no = ?, date_of_birth = ?, blood_type = ?, gender = ?,
                height = ?, weight = ?, allergies = ?, diseases = ?, phone_number = ?
             WHERE id = ?`,
            [
                tc_no || null,
                formattedDate,
                blood_type || null,
                gender || null,
                height || null,
                weight || null,
                allergies || null,
                diseases || null,
                phone_number || null,
                patientId
            ]
        );

        res.status(200).send('Profil başarıyla güncellendi.');

    } catch (error) {
        console.error('Hasta profili güncelleme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};


// 4. Doktor için Hasta Detayı (Bu fonksiyon artık kullanılmayacak, searchPatientByTc kullanılacak)

// TC Numarasına göre hasta arama fonksiyonu
export const searchPatientByTc = async (req, res) => {
    const tcNo = req.query.tc; // Frontend ?tc=... şeklinde gönderiyor

    if (!tcNo) {
        return res.status(400).send('TC numarası gerekli.');
    }

    try {
        const [patients] = await pool.execute(
            `SELECT p.*, u.email
             FROM patients p
             JOIN users u ON p.user_id = u.id
             WHERE p.tc_no = ?`,
            [tcNo]
        );

        if (patients.length === 0) {
            return res.status(404).send('Hasta bulunamadı.');
        }

        res.status(200).json(patients[0]);
    } catch (error) {
        console.error("Arama Hatası:", error);
        res.status(500).send('Sunucu hatası.');
    }
};
export const getPatientDetailById = async (req, res) => {
    // Bu fonksiyonu koruyabilirsiniz ancak DoctorPage.jsx'te TC'ye göre arama kullandık.
    const patientId = req.params.id;

    try {
        const [rows] = await pool.execute(
            `SELECT
                p.first_name,
                p.last_name,
                p.tc_no,
                p.date_of_birth,
                p.gender,
                p.phone_number,
                u.email
            FROM patients p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?`,
            [patientId]
        );

        if (rows.length === 0) {
            return res.status(404).send('Hasta bulunamadı.');
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Hasta detay çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};