// src/services/api.js (TÜM GEREKLİ EXPORT'LARI İÇEREN NİHAİ YAPI)

import axios from 'axios';

// Backend API'nizin adresi
// Lütfen burayı kendi backend adresinizle değiştirin
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
             // Sunucudan gelen rol, istenen rolle eşleşmezse
             throw new Error("Kullanıcı rolü hatalı.");
        }

        setAuthToken(token);
        localStorage.setItem('userRole', returnedRole);
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', email);

        // Kullanıcı detaylarını döndür
        return {
            id: userId,
            email,
            role: returnedRole,
            firstName: first_name,
            lastName: last_name,
            specialization: specialization,
            title: title // Unvan bilgisi
        };

    } catch (error) {
        const errorMessage = error.response?.data || "Giriş başarısız oldu. Sunucu hatası.";
        throw new Error(errorMessage);
    }
}

export async function register(userData) {
    try {
        const response = await api.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data || "Kayıt başarısız oldu. Sunucu hatası.";
        throw new Error(errorMessage);
    }
}


// *************** ADMIN VE YÖNETİM FONKSİYONLARI ***************
export const getAllUsers = () => api.get('/admin/users');
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);
export const getSpecializations = () => api.get('/admin/specializations');
export const getGeneralReports = () => api.get('/admin/reports');

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


// *************** DOKTOR FONKSİYONLARI ***************
export const getAllDoctors = () => api.get('/doctors');

/**
 * Doktor kendi profilini görüntüler
 */
export const getDoctorProfile = () => api.get('/doctors/profile');

/**
 * Doktor kendi bilgilerini (ad, soyad, email, şifre) günceller
 */
export const updateDoctorProfile = (data) =>
    api.patch('/doctors/profile', data);

export const updateDoctorLeaveDates = (leaveDates) =>
    api.patch('/doctors/leave', { leaveDates });

export const getDoctorAppointments = () =>
    api.get('/appointments/doctor');

export const updateAppointmentStatus = (appointmentId, status, note) =>
    api.patch(`/appointments/${appointmentId}`, { status, note });


export default api;