// src/pages/AdminPage.jsx
import { useState } from "react";
import "../styles/layout.css";

export default function AdminPage({ user, onLogout }) {
    const [activeSection, setActiveSection] = useState("overview");

    // --- ÖRNEK VERİLER ---
    const [doctors, setDoctors] = useState([
        { id: 1, name: "Dr. Ayşe Yılmaz", branch: "Kardiyoloji", status: "Aktif" },
        { id: 2, name: "Dr. Mehmet Demir", branch: "Dahiliye", status: "Aktif" },
        { id: 3, name: "Dr. Selin Kaya", branch: "Nöroloji", status: "İzinli" },
    ]);

    const [patients, setPatients] = useState([
        { id: 1, name: "Ali Veli", tc: "11111111111", status: "Aktif" },
        { id: 2, name: "Zeynep Koç", tc: "22222222222", status: "Aktif" },
        { id: 3, name: "Mert Yıldız", tc: "33333333333", status: "Pasif" },
    ]);

    const [clinics, setClinics] = useState([
        { id: 1, name: "Kardiyoloji", floor: "3. Kat", status: "Aktif" },
        { id: 2, name: "Dahiliye", floor: "2. Kat", status: "Aktif" },
        { id: 3, name: "Göz", floor: "1. Kat", status: "Pasif" },
    ]);

    const [appointments] = useState([
        { id: 1, date: "2025-12-04", clinic: "Kardiyoloji", status: "Tamamlandı" },
        { id: 2, date: "2025-12-04", clinic: "Dahiliye", status: "Gelmedi" },
        { id: 3, date: "2025-12-03", clinic: "Göz", status: "Tamamlandı" },
        { id: 4, date: "2025-12-03", clinic: "Kardiyoloji", status: "Bekliyor" },
        { id: 5, date: "2025-12-02", clinic: "Dahiliye", status: "Tamamlandı" },
    ]);

    // MODALLAR
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [doctorForm, setDoctorForm] = useState({
        name: "",
        branch: "",
        status: "Aktif",
    });

    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [patientForm, setPatientForm] = useState({
        name: "",
        tc: "",
        status: "Aktif",
    });

    const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
    const [clinicForm, setClinicForm] = useState({
        name: "",
        floor: "",
        status: "Aktif",
    });

    // ARAMA
    const [doctorSearch, setDoctorSearch] = useState("");
    const [patientSearch, setPatientSearch] = useState("");

    // DOKTOR İŞLEMLERİ
    function openNewDoctorModal() {
        setEditingDoctor(null);
        setDoctorForm({ name: "", branch: "", status: "Aktif" });
        setIsDoctorModalOpen(true);
    }

    function openEditDoctorModal(doctor) {
        setEditingDoctor(doctor);
        setDoctorForm({
            name: doctor.name,
            branch: doctor.branch,
            status: doctor.status,
        });
        setIsDoctorModalOpen(true);
    }

    function handleDoctorFormChange(e) {
        setDoctorForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handleDoctorSave(e) {
        e.preventDefault();
        if (!doctorForm.name.trim() || !doctorForm.branch.trim()) return;

        if (editingDoctor) {
            setDoctors((prev) =>
                prev.map((d) =>
                    d.id === editingDoctor.id ? { ...d, ...doctorForm } : d
                )
            );
        } else {
            setDoctors((prev) => [...prev, { id: Date.now(), ...doctorForm }]);
        }

        setIsDoctorModalOpen(false);
        setEditingDoctor(null);
    }

    function handleDoctorDelete(id) {
        if (!window.confirm("Bu doktoru silmek istiyor musunuz?")) return;
        setDoctors((prev) => prev.filter((d) => d.id !== id));
    }

    // HASTA İŞLEMLERİ
    function openNewPatientModal() {
        setEditingPatient(null);
        setPatientForm({ name: "", tc: "", status: "Aktif" });
        setIsPatientModalOpen(true);
    }

    function openEditPatientModal(patient) {
        setEditingPatient(patient);
        setPatientForm({
            name: patient.name,
            tc: patient.tc,
            status: patient.status,
        });
        setIsPatientModalOpen(true);
    }

    function handlePatientFormChange(e) {
        setPatientForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handlePatientSave(e) {
        e.preventDefault();
        if (!patientForm.name.trim() || !patientForm.tc.trim()) return;

        if (editingPatient) {
            setPatients((prev) =>
                prev.map((p) =>
                    p.id === editingPatient.id ? { ...p, ...patientForm } : p
                )
            );
        } else {
            setPatients((prev) => [...prev, { id: Date.now(), ...patientForm }]);
        }

        setIsPatientModalOpen(false);
        setEditingPatient(null);
    }

    function handlePatientDelete(id) {
        if (!window.confirm("Hastayı silmek istiyor musunuz?")) return;
        setPatients((prev) => prev.filter((p) => p.id !== id));
    }

    // POLİKLİNİK İŞLEMLERİ
    function openClinicModal() {
        setClinicForm({ name: "", floor: "", status: "Aktif" });
        setIsClinicModalOpen(true);
    }

    function handleClinicFormChange(e) {
        setClinicForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handleClinicSave(e) {
        e.preventDefault();
        if (!clinicForm.name.trim()) return;

        const newClinic = { id: Date.now(), ...clinicForm };
        setClinics((prev) => [...prev, newClinic]);
        setIsClinicModalOpen(false);
    }

    // FİLTRELENMİŞ LİSTELER
    const filteredDoctors = doctors.filter((d) =>
        d.name.toLowerCase().includes(doctorSearch.toLowerCase())
    );

    const filteredPatients = patients.filter(
        (p) =>
            p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
            p.tc.includes(patientSearch)
    );

    // ==== RENDER SECTIONS ====

    function renderOverview() {
        return (
            <div>
                <h1 className="admin-title">Admin Paneli</h1>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Toplam Randevu</div>
                        <div className="stat-value">{appointments.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Aktif Doktor</div>
                        <div className="stat-value">
                            {doctors.filter((d) => d.status === "Aktif").length}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Aktif Hasta</div>
                        <div className="stat-value">
                            {patients.filter((p) => p.status === "Aktif").length}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Aktif Poliklinik</div>
                        <div className="stat-value">
                            {clinics.filter((c) => c.status === "Aktif").length}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderUsers() {
        return (
            <div>
                <h1 className="admin-title">Kullanıcılar</h1>
                <div className="card">
                    <div className="admin-two-column">
                        {/* Doktorlar */}
                        <div className="admin-subcard">
                            <div className="admin-subcard-header">
                                <h3>Doktorlar</h3>
                                <button className="primary-button" onClick={openNewDoctorModal}>
                                    Yeni Doktor
                                </button>
                            </div>

                            <div className="search-row">
                                <input
                                    className="form-input"
                                    placeholder="Doktor ara..."
                                    value={doctorSearch}
                                    onChange={(e) => setDoctorSearch(e.target.value)}
                                />
                            </div>

                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Ad Soyad</th>
                                        <th>Branş</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDoctors.map((d) => (
                                        <tr key={d.id}>
                                            <td>{d.name}</td>
                                            <td>{d.branch}</td>
                                            <td>{d.status}</td>
                                            <td>
                                                <button
                                                    className="chip-button chip-secondary"
                                                    onClick={() => openEditDoctorModal(d)}
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    className="chip-button chip-danger"
                                                    onClick={() => handleDoctorDelete(d.id)}
                                                >
                                                    Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Hastalar */}
                        <div className="admin-subcard">
                            <div className="admin-subcard-header">
                                <h3>Hastalar</h3>
                                <button className="primary-button" onClick={openNewPatientModal}>
                                    Yeni Hasta
                                </button>
                            </div>

                            <div className="search-row">
                                <input
                                    className="form-input"
                                    placeholder="Hasta ara..."
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                />
                            </div>

                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Ad Soyad</th>
                                        <th>TC</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatients.map((p) => (
                                        <tr key={p.id}>
                                            <td>{p.name}</td>
                                            <td>{p.tc}</td>
                                            <td>{p.status}</td>
                                            <td>
                                                <button
                                                    className="chip-button chip-secondary"
                                                    onClick={() => openEditPatientModal(p)}
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    className="chip-button chip-danger"
                                                    onClick={() => handlePatientDelete(p.id)}
                                                >
                                                    Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderClinics() {
        return (
            <div>
                <h1 className="admin-title">Poliklinikler</h1>
                <div className="card">
                    <div className="admin-subcard-header">
                        <h3>Poliklinik Yönetimi</h3>
                        <button className="primary-button" onClick={openClinicModal}>
                            Poliklinik Ekle
                        </button>
                    </div>

                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Adı</th>
                                <th>Kat</th>
                                <th>Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clinics.map((c) => (
                                <tr key={c.id}>
                                    <td>{c.name}</td>
                                    <td>{c.floor}</td>
                                    <td>{c.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    function renderReports() {
        const completed = appointments.filter((a) => a.status === "Tamamlandı").length;
        const noShow = appointments.filter((a) => a.status === "Gelmedi").length;

        return (
            <div>
                <h1 className="admin-title">Raporlar</h1>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Toplam Randevu</div>
                        <div className="stat-value">{appointments.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Tamamlanan</div>
                        <div className="stat-value">{completed}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Gelmedi</div>
                        <div className="stat-value">{noShow}</div>
                    </div>
                </div>

                <div className="card" style={{ marginTop: "16px" }}>
                    <h2>Poliklinik Randevu Yoğunluğu</h2>

                    <table className="admin-table" style={{ marginTop: "12px" }}>
                        <thead>
                            <tr>
                                <th>Poliklinik</th>
                                <th>Kat</th>
                                <th>Durum</th>
                                <th>Randevu Sayısı</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clinics.map((c) => {
                                const count = appointments.filter(
                                    (a) => a.clinic === c.name
                                ).length;

                                return (
                                    <tr key={c.id}>
                                        <td>{c.name}</td>
                                        <td>{c.floor}</td>
                                        <td>{c.status}</td>
                                        <td>{count}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // ==== RETURN ====

    return (
        <div className="app-layout">
            <aside className="app-sidebar">
                <div>
                    <h2 className="app-sidebar-title">Cankaya Hospital</h2>
                    <p className="app-sidebar-subtitle">@admin · yönetici</p>

                    <div className="sidebar-buttons">
                        <button className="sidebar-button" onClick={() => setActiveSection("overview")}>
                            Genel Bakış
                        </button>

                        <button className="sidebar-button" onClick={() => setActiveSection("users")}>
                            Kullanıcılar
                        </button>

                        <button className="sidebar-button" onClick={() => setActiveSection("clinics")}>
                            Poliklinikler
                        </button>

                        <button className="sidebar-button" onClick={() => setActiveSection("reports")}>
                            Raporlar
                        </button>
                    </div>
                </div>

                <button className="logout-button" onClick={onLogout}>
                    Çıkış
                </button>
            </aside>

            <main className="app-main">
                {activeSection === "overview" && renderOverview()}
                {activeSection === "users" && renderUsers()}
                {activeSection === "clinics" && renderClinics()}
                {activeSection === "reports" && renderReports()}
            </main>

            {/* DOKTOR MODAL */}
            {isDoctorModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <h2>{editingDoctor ? "Doktor Düzenle" : "Yeni Doktor"}</h2>
                        <form onSubmit={handleDoctorSave}>
                            <div className="form-field">
                                <label>Ad Soyad</label>
                                <input
                                    className="form-input"
                                    name="name"
                                    value={doctorForm.name}
                                    onChange={handleDoctorFormChange}
                                />
                            </div>

                            <div className="form-field">
                                <label>Branş</label>
                                <input
                                    className="form-input"
                                    name="branch"
                                    value={doctorForm.branch}
                                    onChange={handleDoctorFormChange}
                                />
                            </div>

                            <div className="form-field">
                                <label>Durum</label>
                                <select
                                    className="form-input"
                                    name="status"
                                    value={doctorForm.status}
                                    onChange={handleDoctorFormChange}
                                >
                                    <option>Aktif</option>
                                    <option>Pasif</option>
                                    <option>İzinli</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="modal-button modal-cancel"
                                    onClick={() => setIsDoctorModalOpen(false)}
                                >
                                    İptal
                                </button>
                                <button className="modal-button modal-save">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* HASTA MODAL */}
            {isPatientModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <h2>{editingPatient ? "Hasta Düzenle" : "Yeni Hasta"}</h2>
                        <form onSubmit={handlePatientSave}>
                            <div className="form-field">
                                <label>Ad Soyad</label>
                                <input
                                    className="form-input"
                                    name="name"
                                    value={patientForm.name}
                                    onChange={handlePatientFormChange}
                                />
                            </div>

                            <div className="form-field">
                                <label>TC Kimlik No</label>
                                <input
                                    className="form-input"
                                    name="tc"
                                    value={patientForm.tc}
                                    onChange={handlePatientFormChange}
                                />
                            </div>

                            <div className="form-field">
                                <label>Durum</label>
                                <select
                                    className="form-input"
                                    name="status"
                                    value={patientForm.status}
                                    onChange={handlePatientFormChange}
                                >
                                    <option>Aktif</option>
                                    <option>Pasif</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="modal-button modal-cancel"
                                    onClick={() => setIsPatientModalOpen(false)}
                                >
                                    İptal
                                </button>
                                <button className="modal-button modal-save">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* POLIKLINIK MODAL */}
            {isClinicModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <h2>Yeni Poliklinik</h2>
                        <form onSubmit={handleClinicSave}>
                            <div className="form-field">
                                <label>Poliklinik Adı</label>
                                <input
                                    className="form-input"
                                    name="name"
                                    value={clinicForm.name}
                                    onChange={handleClinicFormChange}
                                />
                            </div>

                            <div className="form-field">
                                <label>Kat</label>
                                <input
                                    className="form-input"
                                    name="floor"
                                    value={clinicForm.floor}
                                    onChange={handleClinicFormChange}
                                />
                            </div>

                            <div className="form-field">
                                <label>Durum</label>
                                <select
                                    className="form-input"
                                    name="status"
                                    value={clinicForm.status}
                                    onChange={handleClinicFormChange}
                                >
                                    <option>Aktif</option>
                                    <option>Pasif</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="modal-button modal-cancel"
                                    onClick={() => setIsClinicModalOpen(false)}
                                >
                                    İptal
                                </button>
                                <button className="modal-button modal-save">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
