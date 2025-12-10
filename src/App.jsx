import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DoctorPage from "./pages/DoctorPage";
import PatientPage from "./pages/PatientPage";
import AdminPage from "./pages/AdminPage";

function App() {
  const [user, setUser] = useState(null);

  const handleLogout = () => setUser(null);

  if (!user) return <LoginPage onLogin={setUser} />;

  if (user.role === "doctor")
    return <DoctorPage user={user} onLogout={handleLogout} />;

  if (user.role === "patient")
    return <PatientPage user={user} onLogout={handleLogout} />;

  if (user.role === "admin")
    return <AdminPage user={user} onLogout={handleLogout} />;

  return <LoginPage onLogin={setUser} />;
}

export default App;

