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
        // Tüm isteklere Authorization başlığını ekle
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('token', token);
    } else {
        // Token'ı kaldır
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
    }
};

export const initializeAuthToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
        setAuthToken(token); // Token varsa ayarla
        return true;
    }
    return false;
};

// --- AUTH FONKSİYONLARI ---
export async function loginRequest(email, password, role) {
    try {
        const response = await api.post('/auth/login', { email, password });
        const { token, role: returnedRole, userId } = response.data;

        if (returnedRole !== role) {
             throw new Error("Kullanıcı rolü hatalı.");
        }

        setAuthToken(token);
        localStorage.setItem('userRole', returnedRole);
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', email);

        return { id: userId, email, role: returnedRole };

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

// Tüm kullanıcıları getir (Doktor, Hasta, Admin)
export const getAllUsers = () => api.get('/admin/users');

// Kullanıcı silme
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);

// Poliklinik listesini getir
export const getSpecializations = () => api.get('/admin/specializations');

// Genel sistem raporlarını getir
export const getGeneralReports = () => api.get('/admin/reports');

/**
 * Mevcut doktorun bilgilerini günceller (AdminPage'den çağrılır).
 * @param {number} userId - Güncellenecek doktorun ID'si
 * @param {object} data - Güncel kullanıcı bilgileri (email, first_name, title, specialization vb.)
 */
export const updateDoctor = async (userId, data) => {
    try {
        // Backend'de bu rotanın PUT/PATCH '/admin/doctor/:userId' şeklinde olması beklenir.
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


// *************** DOKTOR FONKSİYONLARI ***************
export const getAllDoctors = () => api.get('/doctors');
export const getDoctorAppointments = (doctorId) => api.get(`/appointments/doctor/${doctorId}`); // Doktor randevularını çek (örnek rota)
export const createAppointment = (payload) => api.post('/appointments', payload);
export const updateAppointmentStatus = (appointmentId, status, note) => {
    return api.patch(`/appointments/${appointmentId}`, { status, note });
};


export default api;