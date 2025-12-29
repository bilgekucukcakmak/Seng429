import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import api from "../../services/api"; // ✅ tek axios kaynağı

export default function AdminDashboard() {
  const [specializationData, setSpecializationData] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 POLİKLİNİK BAZLI RANDEVULAR
  useEffect(() => {
    api
      .get("/admin/reports/appointments-by-specialization")
      .then(res => setSpecializationData(res.data))
      .catch(console.error);
  }, []);

  // 🔹 BAR TIKLAMA (DOĞRU PAYLOAD OKUMA)
  const handleBarClick = (data) => {
    if (!data || !data.specialization) return;

    setSelectedSpec(data.specialization);
    setLoading(true);

    api
      .get(`/admin/reports/doctors-by-specialization/${data.specialization}`)
      .then(res => setDoctorData(res.data))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h2>Poliklinik Bazlı Randevular</h2>

      {/* 🔹 ÜST GRAFİK */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={specializationData}>
          <XAxis dataKey="specialization" />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="count"
            onClick={(e) => handleBarClick(e.payload)} // ✅ KRİTİK DÜZELTME
          />
        </BarChart>
      </ResponsiveContainer>

      {/* 🔹 ALT GRAFİK */}
      {selectedSpec && (
        <>
          <h3>{selectedSpec} – Doktor Bazlı Randevular</h3>

          {loading ? (
            <p>Yükleniyor...</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={doctorData}>
                <XAxis dataKey="doctor" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}
