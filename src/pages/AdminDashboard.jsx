import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer
} from "recharts";
import axios from "../../services/axios";

export default function AdminDashboard() {
  const [specializationData, setSpecializationData] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get("/admin/reports/appointments-by-specialization")
      .then(res => setSpecializationData(res.data))
      .catch(console.error);
  }, []);
  const handleBarClick = (data) => {
    if (!data?.specialization) return;

    setSelectedSpec(data.specialization);
    setLoading(true);

    axios
      .get(`/admin/reports/doctors-by-specialization/${data.specialization}`)
      .then(res => setDoctorData(res.data))
      .finally(() => setLoading(false));
  };
  return (
    <div>
      <h2>Poliklinik Bazlı Randevular</h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={specializationData}>
          <XAxis dataKey="specialization" />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="count"
            onClick={handleBarClick}
          />
        </BarChart>
      </ResponsiveContainer>
      {selectedSpec && (
        <>
          <h3>{selectedSpec} – Doktorlar</h3>

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
