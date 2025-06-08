import React, { useState, useMemo } from 'react';
import { FileText, User, Stethoscope, LogOut, PlusCircle, Lock, ChevronRight } from 'lucide-react';

const initialPatients = [
  { id: 'patient-1', name: 'Budi Santoso' },
  { id: 'patient-2', name: 'Citra Lestari' },
];

const initialDoctors = [
  { id: 'doctor-1', name: 'Dr. Anisa' },
];

const initialMedicalRecords = {
  'patient-1': [
    {
      id: `rec-${crypto.randomUUID()}`,
      date: '2024-05-10',
      doctor: 'Dr. Wijaya',
      diagnosis: 'Demam Berdarah, memerlukan istirahat dan pemantauan trombosit.',
      hash: '0x' + Array(40).join(0).replace(/0/g, () => (~~(Math.random() * 16)).toString(16)),
    },
    {
      id: `rec-${crypto.randomUUID()}`,
      date: '2024-06-01',
      doctor: 'Dr. Anisa',
      diagnosis: 'Pemeriksaan rutin, kondisi stabil.',
      hash: '0x' + Array(40).join(0).replace(/0/g, () => (~~(Math.random() * 16)).toString(16)),
    },
  ],
  'patient-2': [
     {
      id: `rec-${crypto.randomUUID()}`,
      date: '2024-06-03',
      doctor: 'Dr. Anisa',
      diagnosis: 'Konsultasi keluhan batuk dan pilek. Diberikan resep obat flu.',
      hash: '0x' + Array(40).join(0).replace(/0/g, () => (~~(Math.random() * 16)).toString(16)),
    },
  ],
};

const CustomStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

    :root {
      --bg-dark: #1a1a2e;
      --bg-light: #16213e;
      --card-bg: #2c3e50;
      --primary: #0f3460;
      --secondary: #e94560;
      --text-main: #e0e0e0;
      --text-muted: #a0a0a0;
      --accent: #5372f0;
      --success: #34d399;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: 'Poppins', sans-serif;
      margin: 0;
    }
    
    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(83, 114, 240, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(83, 114, 240, 0); }
      100% { box-shadow: 0 0 0 0 rgba(83, 114, 240, 0); }
    }
    
    /* General classes */
    .app-container {
      min-height: 100vh;
      animation: fadeIn 0.5s ease-out;
    }

    .header {
      background-color: var(--bg-light);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #3a4b6f;
    }
    
    .header-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .header-title h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-main);
    }
    
    .logout-button {
      background-color: var(--secondary);
      color: white;
      font-weight: 600;
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .logout-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
    }
    
    /* Login Screen */
    .login-screen {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1rem;
    }

    .login-card {
      width: 100%;
      max-width: 450px;
      background-color: var(--bg-light);
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      animation: fadeIn 0.5s ease-out;
      border: 1px solid #3a4b6f;
    }
    
    .login-card h1 {
        font-size: 2rem;
        font-weight: 700;
        text-align: center;
        color: var(--text-main);
    }
    
    .login-card p {
        text-align: center;
        color: var(--text-muted);
        margin-top: 0.5rem;
        margin-bottom: 2rem;
    }

    .login-input {
        width: 100%;
        padding: 0.9rem;
        border: 1px solid #3a4b6f;
        border-radius: 8px;
        background-color: var(--bg-dark);
        color: var(--text-main);
        font-size: 1rem;
        transition: all 0.3s ease;
    }
    
    .login-input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(83, 114, 240, 0.5);
    }
    
    .login-button {
      width: 100%;
      padding: 1rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: white;
      background-color: var(--accent);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .login-button:hover {
      background-color: #405de6;
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(83, 114, 240, 0.4);
    }
    
    /* Doctor Dashboard */
    .doctor-dashboard {
      display: flex;
      height: calc(100vh - 75px); /* Header height */
    }

    .patient-list-panel {
      width: 35%;
      max-width: 400px;
      background-color: var(--bg-light);
      padding: 1.5rem;
      border-right: 1px solid #3a4b6f;
      overflow-y: auto;
    }
    
    .patient-list-panel h3 {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
    }
    
    .patient-button {
      width: 100%;
      text-align: left;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid transparent;
      margin-bottom: 0.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.3s ease;
      background-color: var(--card-bg);
      color: var(--text-main);
    }

    .patient-button:hover {
      border-color: var(--accent);
      transform: translateX(5px);
    }

    .patient-button.selected {
      background-color: var(--accent);
      color: white;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(83, 114, 240, 0.3);
    }
    
    .details-panel {
        flex-grow: 1;
        padding: 2.5rem;
        overflow-y: auto;
    }
    
    .details-panel h2 {
        font-size: 2rem;
        margin-bottom: 2rem;
    }
    
    /* Record Card */
    .record-card {
      background-color: var(--card-bg);
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      border-left: 5px solid var(--accent);
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      animation: fadeIn 0.4s ease-out forwards;
      opacity: 0;
      animation-delay: calc(var(--i, 0) * 100ms);
    }

    .record-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    
    .record-doctor {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background-color: var(--bg-light);
        color: var(--text-main);
        padding: 0.4rem 0.8rem;
        border-radius: 20px;
        font-size: 0.9rem;
    }
    
    .record-hash {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      background-color: #374151;
      padding: 0.5rem;
      border-radius: 6px;
      margin-top: 1rem;
      word-break: break-all;
    }
    
    /* Add Record Form */
    .add-record-form {
        background-color: var(--card-bg);
        padding: 2rem;
        border-radius: 12px;
        margin-top: 2rem;
        border: 1px solid #3a4b6f;
    }
    
    .add-record-form textarea {
        width: 100%;
        padding: 1rem;
        border: 1px solid #3a4b6f;
        border-radius: 8px;
        background-color: var(--bg-light);
        color: var(--text-main);
        font-size: 1rem;
        resize: vertical;
        min-height: 100px;
        transition: all 0.3s ease;
    }
    
    .add-record-form textarea:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(83, 114, 240, 0.5);
    }
    
    .add-record-button {
      width: 100%;
      padding: 1rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: white;
      background-color: var(--success);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 1rem;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }
    
    .add-record-button:hover {
        background-color: #25a274;
        transform: translateY(-2px);
    }
    
    .add-record-button:disabled {
        background-color: #4a5568;
        cursor: not-allowed;
        transform: none;
    }
  `}
  </style>
);

const Header = ({ user, onLogout }) => (
  <header className="header">
    <div className="header-title">
      <FileText className="text-blue-400 h-8 w-8" />
      <h1>MediLedger</h1>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <span className="text-muted">Selamat datang, <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{user.name}</span></span>
      <button onClick={onLogout} className="logout-button">
        <LogOut size={20} />
        Logout
      </button>
    </div>
  </header>
);

const RecordCard = ({ record, index }) => (
  <div className="record-card" style={{ '--i': index }}>
    <div className="record-header">
      <div>
        <p className="text-muted">{record.date}</p>
        <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0.25rem 0' }}>Diagnosis</p>
      </div>
      <div className="record-doctor">
        <Stethoscope size={16} />
        {record.doctor}
      </div>
    </div>
    <p>{record.diagnosis}</p>
    <div className="record-hash">
      <Lock size={14} />
      <span style={{ overflowWrap: 'break-word' }}>Hash: {record.hash}</span>
    </div>
  </div>
);

const PatientDashboard = ({ patient, records }) => (
  <div className="details-panel">
    <h2>Rekam Medis Anda</h2>
    <div>
      {records.length > 0 ? (
        records.map((record, index) => <RecordCard key={record.id} record={record} index={index} />)
      ) : (
        <p>Belum ada rekam medis.</p>
      )}
    </div>
  </div>
);

const DoctorDashboard = ({ doctor, patients, records, onAddRecord }) => {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [newDiagnosis, setNewDiagnosis] = useState('');

  const selectedPatientRecords = useMemo(() => {
    if (!selectedPatientId) return [];
    return records[selectedPatientId] || [];
  }, [selectedPatientId, records]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleAddRecord = (e) => {
    e.preventDefault();
    if (!newDiagnosis.trim() || !selectedPatientId) return;
    const newRecord = {
      id: `rec-${crypto.randomUUID()}`,
      date: new Date().toISOString().split('T')[0],
      doctor: doctor.name,
      diagnosis: newDiagnosis,
      hash: '0x' + Array(40).join(0).replace(/0/g, () => (~~(Math.random() * 16)).toString(16)),
    };
    onAddRecord(selectedPatientId, newRecord);
    setNewDiagnosis('');
  };

  return (
    <div className="doctor-dashboard">
      <div className="patient-list-panel">
        <h3>Daftar Pasien</h3>
        <ul>
          {patients.map(patient => (
            <li key={patient.id}>
              <button
                onClick={() => setSelectedPatientId(patient.id)}
                className={`patient-button ${selectedPatientId === patient.id ? 'selected' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <User size={20} />
                  <span style={{ fontWeight: 500 }}>{patient.name}</span>
                </div>
                <ChevronRight size={20} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="details-panel">
        {selectedPatient ? (
          <>
            <h2>Rekam Medis: {selectedPatient.name}</h2>
            <div>
              {selectedPatientRecords.map((record, index) => (
                <RecordCard key={record.id} record={record} index={index} />
              ))}
            </div>

            <form onSubmit={handleAddRecord} className="add-record-form">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Tambah Catatan Medis Baru</h3>
              <textarea
                value={newDiagnosis}
                onChange={(e) => setNewDiagnosis(e.target.value)}
                placeholder="Tulis diagnosis baru di sini..."
              />
              <button
                type="submit"
                className="add-record-button"
                disabled={!newDiagnosis.trim()}
              >
                <PlusCircle size={20} />
                Tambahkan ke "Blockchain"
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>Pilih pasien untuk melihat detailnya.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin, patients, doctors }) => {
  const [role, setRole] = useState('patient');
  const [selectedId, setSelectedId] = useState(patients[0].id);

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    setSelectedId(newRole === 'patient' ? patients[0].id : doctors[0].id);
  };
    
  const list = role === 'patient' ? patients : doctors;

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>MediLedger</h1>
        <p>Sistem Rekam Medis Terdesentralisasi</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Login sebagai:</label>
            <select value={role} onChange={handleRoleChange} className="login-input">
              <option value="patient">Pasien</option>
              <option value="doctor">Dokter</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Pilih Pengguna:</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="login-input">
              {list.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <button onClick={() => onLogin(selectedId, role)} className="login-button">
            {role === 'patient' ? <User /> : <Stethoscope />}
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [patients] = useState(initialPatients);
  const [doctors] = useState(initialDoctors);
  const [medicalRecords, setMedicalRecords] = useState(initialMedicalRecords);

  const handleLogin = (id, role) => {
    const userList = role === 'patient' ? patients : doctors;
    const user = userList.find(u => u.id === id);
    if (user) {
      setCurrentUser({ ...user, role });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddRecord = (patientId, newRecord) => {
    setMedicalRecords(prevRecords => {
      const existingRecords = prevRecords[patientId] || [];
      return {
        ...prevRecords,
        [patientId]: [...existingRecords, newRecord],
      };
    });
  };

  return (
    <>
      <CustomStyles />
      <div className="app-container">
        {!currentUser ? (
          <LoginScreen onLogin={handleLogin} patients={patients} doctors={doctors} />
        ) : (
          <>
            <Header user={currentUser} onLogout={handleLogout} />
            <main>
              {currentUser.role === 'patient' && (
                <PatientDashboard
                  patient={currentUser}
                  records={medicalRecords[currentUser.id] || []}
                />
              )}
              {currentUser.role === 'doctor' && (
                <DoctorDashboard
                  doctor={currentUser}
                  patients={patients}
                  records={medicalRecords}
                  onAddRecord={handleAddRecord}
                />
              )}
            </main>
          </>
        )}
      </div>
    </>
  );
}