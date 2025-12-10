// src/services/api.js

// Şimdilik backend yoksa bile sorun çıkarmasın diye
// MOCK veriyle çalışan bir loginRequest yazıyoruz.
// Arkadaşların backend yazınca burayı fetch ile değiştirebiliriz.

const API_BASE = "http://localhost:8080/api";
// Şimdilik kullanmıyoruz ama backend gelince işimize yarar :)

// 🔹 LOGIN – hem mock, hem backend'e hazır
export async function loginRequest(username, password, role) {
    // --- MOCK (backend yoksa) ---
    const MOCK_USERS = [
        { id: 1, username: "admin", password: "1234", role: "admin" },
        { id: 2, username: "doktor1", password: "1234", role: "doctor" },
        { id: 3, username: "hasta1", password: "1234", role: "patient" },
    ];

    const found = MOCK_USERS.find(
        (u) =>
            u.username === username.trim() &&
            u.password === password &&
            u.role === role
    );

    if (!found) {
        throw new Error("Kullanıcı adı / şifre / rol hatalı.");
    }

    // Burada normalde backend'den dönen user objesini döndürmüş olacağız.
    // Şimdilik mock user dönüyoruz.
    return found;

    /*
    // --- BACKEND EKLENDİĞİNDE ŞÖYLE OLABİLİR ---
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    });
  
    if (!res.ok) {
      throw new Error("Giriş başarısız.");
    }
  
    const data = await res.json();
    return data;
    */
}

// 🔹 Doktor bugünkü randevuları – şimdilik boş liste dönsün
export async function getDoctorTodayAppointments(doctorId) {
    // Backend gelene kadar boş array dönüyoruz ki component patlamasın
    return [];
    /*
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/appointments/today`);
    if (!res.ok) throw new Error("Randevular alınamadı.");
    return await res.json();
    */
}

// 🔹 Hasta tarafı için fonksiyonlar – şimdilik hepsi boş veri dönsün

export async function getPatientClinics() {
    // Örnek mock veri:
    return [
        { id: 1, name: "Kardiyoloji" },
        { id: 2, name: "Dahiliye" },
        { id: 3, name: "Nöroloji" },
    ];
    /*
    const res = await fetch(`${API_BASE}/clinics`);
    if (!res.ok) throw new Error("Poliklinikler alınamadı.");
    return await res.json();
    */
}

export async function getPatientAppointments(patientId) {
    return [];
    /*
    const res = await fetch(`${API_BASE}/patients/${patientId}/appointments`);
    if (!res.ok) throw new Error("Randevular alınamadı.");
    return await res.json();
    */
}

export async function getPatientHistory(patientId) {
    return [];
    /*
    const res = await fetch(`${API_BASE}/patients/${patientId}/history`);
    if (!res.ok) throw new Error("Geçmiş alınamadı.");
    return await res.json();
    */
}

export async function createAppointment(payload) {
    console.log("Randevu oluştur (mock):", payload);
    // Sanki backend'e kaydetmişiz gibi davranalım:
    return { success: true };
    /*
    const res = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    if (!res.ok) throw new Error("Randevu oluşturulamadı.");
    return await res.json();
    */
}
