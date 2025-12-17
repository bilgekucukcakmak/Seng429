// src/services/api.js

import axios from 'axios';

// Backend API'nizin adresi
const API_URL = 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- JWT TOKEN YÖNETİMİ ---
export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('token', token);
    } else {
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
    }
};

export const initializeAuthToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
        setAuthToken(token);
        return true;
    }
    return false;
};

// *************** AUTH FONKSİYONLARI ***************
export async function loginRequest(email, password, role) {
    try {
        const response = await api.post('/auth/login', { email, password });
        const { token, role: returnedRole, userId, first_name, last_name, specialization, title } = response.data;

        if (returnedRole !== role) {
             throw new Error("Kullanıcı rolü hatalı.");
        }

        setAuthToken(token);
        localStorage.setItem('userRole', returnedRole);
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', email);

        return {
            id: userId,
            email,
            role: returnedRole,
            firstName: first_name,
            lastName: last_name,
            specialization: specialization,
            title: title
        };
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.response?.data || "Giriş başarısız oldu. Sunucu hatası.";
        throw new Error(errorMessage);
    }
}

export async function register(userData) {
    try {
        const response = await api.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.response?.data || "Kayıt başarısız oldu. Sunucu hatası.";
        throw new Error(errorMessage);
    }
}

// *************** ADMIN VE YÖNETİM FONKSİYONLARI ***************
export const getAllUsers = () => api.get('/admin/users');
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);
export const getSpecializations = () => api.get('/admin/specializations');
export const getGeneralReports = () => api.get('/admin/reports');
export const getAppointmentStats = (period) =>
    api.get(`/admin/reports/appointment-stats`, { params: { period } });
export const updateDoctor = async (userId, data) => {
    try {
        const response = await api.put(`/admin/doctor/${userId}`, data);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Doktor bilgileri güncellenirken sunucu hatası oluştu.";
        throw new Error(errorMessage);
    }
};

// *************** HASTA FONKSİYONLARI ***************
export const getPatientProfile = () => api.get('/patients/profile');
export const updatePatientProfile = (data) => api.patch('/patients/profile', data);
export const getPatientByTc = (tc) => api.get(`/patients/search`, { params: { tc } });
export const getPatientAppointments = () => api.get(`/appointments/patient`);
export const createAppointment = (payload) => api.post('/appointments', payload);

/**
 * Randevu Slotlarını Çekme
 * Not: Hafta sonu kısıtlaması Backend'de "Acil" doktoru için
 * istisna olarak tanımlanmış olmalıdır.
 */
export const getAvailableSlots = (doctorId, date) =>
    api.get(`/appointments/slots/${doctorId}/${date}`);

// *************** DOKTOR FONKSİYONLARI ***************
export const getAllDoctors = () => api.get('/doctors');
export const getDoctorProfile = () => api.get('/doctors/profile');
export const updateDoctorProfile = (data) => api.patch('/doctors/profile', data);
export const getDoctorLeaveDates = () => api.get('/doctors/leave');
export const updateDoctorLeaveDates = (leaveDates) => api.patch('/doctors/leave', { leaveDates });
export const getDoctorAppointments = () => api.get('/appointments/doctor');

// *************** RANDEVU GÜNCELLEME (DOKTOR NOTU DAHİL) ***************
export const updateAppointmentStatus = (appointmentId, status, doctorNote) => {
    const data = {};

    // Status doluysa (scheduled, completed, canceled vb.) ekle
    if (status) {
        data.status = status;
    }

    // Backend 'note' beklediği için alan adını note olarak ayarladık
    if (doctorNote !== undefined && doctorNote !== null) {
        data.note = doctorNote;
    }

    return api.patch(`/appointments/${appointmentId}`, data);
};

// *************** EKSTRA YARDIMCI FONKSİYONLAR ***************

/**
 * TC No ile randevu geçmişi sorgulama
 */
export const getPatientAppointmentsByTc = (tcNo) =>
    api.get(`/appointments/patient/tc/${tcNo}`);

/**
 * Hafta sonu kontrolü (Acil Doktor istisnası ile)
 * Bu fonksiyonu PatientPage.jsx içinde tarih seçerken kullanabilirsiniz.
 */
export const isWeekendRestricted = (dateString, doctorInfo) => {
    const date = new Date(dateString);
    const day = date.getDay(); // 0: Pazar, 6: Cumartesi
    const isWeekend = (day === 0 || day === 6);

    // Eğer doktorun adı "Acil" içeriyorsa veya uzmanlığı "Acil" ise kısıtlama yok
    const isAcil = doctorInfo?.firstName?.toLowerCase().includes('acil') ||
                   doctorInfo?.specialization?.toLowerCase().includes('acil');

    if (isAcil) return false; // Acil için kısıtlama yok
    return isWeekend; // Diğerleri için hafta sonu kısıtlı
};
export const getAppointmentsBySpecialization = () =>
  api.get("/admin/reports/appointments-by-specialization");

export const getDoctorsBySpecialization = (spec) =>
  api.get(`/admin/reports/doctors-by-specialization/${spec}`);

export const getAppointmentTrendBySpecialization = (specialization, period = 'month') => {
    return axios.get('/reports/appointments/trend', {
        params: {
            specialization,
            period
        }
    });
};

export default api;