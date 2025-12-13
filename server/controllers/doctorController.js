// server/controllers/doctorController.js (NİHAİ VE TAM HALİ)

import pool from '../db.js';

// Tüm Doktorları Listeleme
export const getAllDoctors = async (req, res) => {
    try {
        const [doctors] = await pool.execute(
            // d.id (doktor tablosundaki birincil anahtar) çekilerek doctor_id alias'ı verilir.
            `SELECT d.id AS doctor_id, d.first_name, d.last_name, d.specialization, u.email
             FROM doctors d JOIN users u ON d.user_id = u.id`
        );

        res.status(200).json(doctors);

    } catch (error) {
        console.error('Doktor listesi çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};