import React, { useState, useEffect, useCallback } from 'react';
import { FileText, User, Stethoscope, LogOut, PlusCircle, Lock, ChevronRight, XCircle, Loader } from 'lucide-react';
// Perbaikan: Impor ethers dari CDN untuk mengatasi masalah resolusi modul
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.min.js';

// --- INFORMASI SMART CONTRACT ---
// !!! PENTING: Ganti alamat ini dengan alamat kontrak yang Anda dapatkan saat deploy !!!
const contractAddress = "0x5F3b8A1a638De722be1C521456b1915A2871e0A3";

// ABI sekarang disisipkan langsung di sini untuk menghilangkan error path
const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "patient",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "doctor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "hasAccess",
        "type": "bool"
      }
    ],
    "name": "AccessChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "patient",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "doctor",
        "type": "address"
      }
    ],
    "name": "RecordAdded",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "accessPermissions",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "patientAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_diagnosis",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_recordHash",
        "type": "string"
      }
    ],
    "name": "addRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "patientAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getRecordByIndex",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "doctor",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "diagnosis",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "recordHash",
            "type": "string"
          }
        ],
        "internalType": "struct MediLedgerContract.MedicalRecord",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "patientAddress",
        "type": "address"
      }
    ],
    "name": "getRecordsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "doctorAddress",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "grant",
        "type": "bool"
      }
    ],
    "name": "manageAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// --- DATABASE PENGGUNA (OFF-CHAIN) ---
const MOCK_PATIENT_ADDRESS_1 = "0xf49f029794fb17013443e7a0eb596f2352cd17d6"; // Hardhat Account #0
const MOCK_PATIENT_ADDRESS_2 = "0x7019d3cc0a363c30d0d31bf55cc6351c78f09a50"; // Hardhat Account #1
const MOCK_DOCTOR_ADDRESS_1 = "0x315d572e8bb47a01f2f3a0fcd76287bd04ddc2cc"; // Hardhat Account #2
const MOCK_DOCTOR_ADDRESS_2 = "0x90fc0c860f75df4e193e30753fb9875bf5dc99c5"; // Hardhat Account #3

const userDatabase = {
    [MOCK_PATIENT_ADDRESS_1.toLowerCase()]: { name: "Budi Santoso", role: "patient" },
    [MOCK_PATIENT_ADDRESS_2.toLowerCase()]: { name: "Citra Lestari", role: "patient" },
    [MOCK_DOCTOR_ADDRESS_1.toLowerCase()]: { name: "Dr. Anisa", role: "doctor" },
    [MOCK_DOCTOR_ADDRESS_2.toLowerCase()]: { name: "Dr. Wijaya", role: "doctor" },
};
const patientList = Object.keys(userDatabase).filter(addr => userDatabase[addr].role === 'patient').map(addr => ({ address: addr, name: userDatabase[addr].name }));
const doctorList = Object.keys(userDatabase).filter(addr => userDatabase[addr].role === 'doctor').map(addr => ({ address: addr, name: userDatabase[addr].name }));


// --- STYLING (TIDAK BERUBAH) ---
const CustomStyles = () => ( <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');:root{--bg-dark:#1a1a2e;--bg-light:#16213e;--card-bg:#2c3e50;--primary:#0f3460;--secondary:#e94560;--text-main:#e0e0e0;--text-muted:#a0a0a0;--accent:#5372f0;--success:#34d399;--danger:#f43f5e;}body{background-color:var(--bg-dark);color:var(--text-main);font-family:'Poppins',sans-serif;margin:0;}@keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}@keyframes spin{to{transform:rotate(360deg);}}.app-container{min-height:100vh;animation:fadeIn .5s ease-out;}.header{background-color:var(--bg-light);padding:1rem 2rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #3a4b6f;}.header-title{display:flex;align-items:center;gap:.75rem;}.header-title h1{font-size:1.75rem;font-weight:700;color:var(--text-main);}.logout-button{background-color:var(--secondary);color:#fff;font-weight:600;padding:.6rem 1.2rem;border:none;border-radius:8px;cursor:pointer;transition:all .3s ease;display:flex;align-items:center;gap:.5rem;}.logout-button:hover{transform:translateY(-2px);box-shadow:0 4px 15px rgba(233,69,96,.4);}.connect-wallet-screen{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1rem;}.connect-wallet-card{width:100%;max-width:450px;background-color:var(--bg-light);padding:2.5rem;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.3);animation:fadeIn .5s ease-out;border:1px solid #3a4b6f;text-align:center;}.connect-wallet-card h1{font-size:2rem;font-weight:700;color:var(--text-main);}.connect-wallet-card p{color:var(--text-muted);margin-top:.5rem;margin-bottom:2rem;}.connect-wallet-button{width:100%;padding:1rem;font-size:1.1rem;font-weight:600;color:#fff;background-color:var(--accent);border:none;border-radius:8px;cursor:pointer;transition:all .3s ease;display:flex;align-items:center;justify-content:center;gap:.75rem;}.connect-wallet-button:hover{background-color:#405de6;transform:translateY(-2px);box-shadow:0 4px 20px rgba(83,114,240,.4);}.dashboard-layout{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:2rem;padding:2.5rem;}.main-panel{display:flex;flex-direction:column;gap:1.5rem;}.side-panel{background-color:var(--bg-light);padding:1.5rem;border-radius:12px;border:1px solid #3a4b6f;}.side-panel h3{font-size:1.5rem;margin-top:0;margin-bottom:1.5rem;}.doctor-dashboard{display:flex;height:calc(100vh - 75px);}.patient-list-panel{width:35%;max-width:400px;background-color:var(--bg-light);padding:1.5rem;border-right:1px solid #3a4b6f;overflow-y:auto;}.patient-list-panel h3{font-size:1.5rem;margin-bottom:1.5rem;}.patient-button{width:100%;text-align:left;padding:1rem;border-radius:8px;border:1px solid transparent;margin-bottom:.75rem;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all .3s ease;background-color:var(--card-bg);color:var(--text-main);}.patient-button:hover{border-color:var(--accent);transform:translateX(5px);}.patient-button.selected{background-color:var(--accent);color:#fff;font-weight:600;box-shadow:0 4px 15px rgba(83,114,240,.3);}.details-panel{flex-grow:1;padding:2.5rem;overflow-y:auto;}.details-panel h2{font-size:2rem;margin-bottom:2rem;}.record-card{background-color:var(--card-bg);padding:1.5rem;border-radius:12px;border-left:5px solid var(--accent);box-shadow:0 4px 15px rgba(0,0,0,.2);animation:fadeIn .4s ease-out forwards;opacity:0;animation-delay:calc(var(--i, 0) * 100ms);}.record-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;}.record-doctor{display:flex;align-items:center;gap:.5rem;background-color:var(--bg-light);color:var(--text-main);padding:.4rem .8rem;border-radius:20px;font-size:.9rem;}.record-hash{display:flex;align-items:center;gap:.5rem;font-size:.75rem;color:var(--text-muted);background-color:#374151;padding:.5rem;border-radius:6px;margin-top:1rem;word-break:break-all;}.add-record-form{background-color:var(--card-bg);padding:2rem;border-radius:12px;margin-top:2rem;border:1px solid #3a4b6f;}.add-record-form textarea{width:100%;box-sizing:border-box;padding:1rem;border:1px solid #3a4b6f;border-radius:8px;background-color:var(--bg-light);color:var(--text-main);font-size:1rem;resize:vertical;min-height:100px;transition:all .3s ease;}.add-record-form textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(83,114,240,.5);}.add-record-button{width:100%;padding:1rem;font-size:1.1rem;font-weight:600;color:#fff;background-color:var(--success);border:none;border-radius:8px;cursor:pointer;margin-top:1rem;transition:all .3s ease;display:flex;align-items:center;justify-content:center;gap:.75rem;}.add-record-button:hover{background-color:#25a274;transform:translateY(-2px);}.add-record-button:disabled{background-color:#4a5568;cursor:not-allowed;transform:none;}.permission-toggle{display:flex;align-items:center;justify-content:space-between;background-color:var(--card-bg);padding:1rem;border-radius:8px;margin-bottom:.75rem;}.toggle-switch{position:relative;display:inline-block;width:50px;height:28px;}.toggle-switch input{opacity:0;width:0;height:0;}.slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:var(--danger);transition:.4s;border-radius:28px;}.slider:before{position:absolute;content:"";height:20px;width:20px;left:4px;bottom:4px;background-color:#fff;transition:.4s;border-radius:50%;}input:checked+.slider{background-color:var(--success);}input:checked+.slider:before{transform:translateX(22px);}.access-denied-card{background-color:var(--card-bg);border:1px solid var(--danger);color:#fff;padding:2rem;border-radius:12px;text-align:center;}.loading-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;gap:1rem;}.loading-spinner{animation:spin 1s linear infinite;}`}</style> );

// --- HELPER UNTUK KONTRAK ---
const getContract = async (withSigner = false) => {
    try {
        if (typeof window.ethereum === 'undefined') {
            throw new Error("Please install MetaMask!");
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        if (withSigner) {
            const signer = await provider.getSigner();
            return new ethers.Contract(contractAddress, contractABI, signer);
        }
        return new ethers.Contract(contractAddress, contractABI, provider);
    } catch (error) {
        console.error("Contract helper error:", error);
        throw error;
    }
};

// --- KOMPONEN-KOMPONEN UI ---
const Header = ({ user, onLogout }) => ( <header className="header"><div className="header-title"><FileText className="text-blue-400 h-8 w-8" /><h1>MediLedger</h1></div><div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span className="text-muted">Welcome, <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{user.name}</span> ({`${user.address.substring(0,6)}...${user.address.substring(user.address.length - 4)}`})</span><button onClick={onLogout} className="logout-button"><LogOut size={20} />Logout</button></div></header> );
const RecordCard = ({ record, index }) => ( <div className="record-card" style={{ '--i': index }}><div className="record-header"><div><p className="text-muted">{new Date(Number(record.timestamp) * 1000).toLocaleDateString()}</p><p style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0.25rem 0' }}>Diagnosis</p></div><div className="record-doctor"><Stethoscope size={16} />{userDatabase[record.doctor.toLowerCase()]?.name || 'Unknown Doctor'}</div></div><p>{record.diagnosis}</p><div className="record-hash"><Lock size={14} /><span style={{ overflowWrap: 'break-word' }}>Hash: {record.recordHash}</span></div></div> );
const ConnectWalletScreen = ({ onConnect, loading }) => ( <div className="connect-wallet-screen"><div className="connect-wallet-card"><FileText size={64} className="text-blue-400" style={{ margin: '0 auto 1.5rem auto' }}/><h1>MediLedger</h1><p>Sistem Rekam Medis Terdesentralisasi yang Aman dan Terpercaya</p><button onClick={onConnect} disabled={loading} className="connect-wallet-button">{loading ? <Loader className="loading-spinner"/> : <User/>}Connect Wallet</button></div></div> );
const LoadingOverlay = ({ message }) => ( <div className="loading-overlay"><Loader size={48} className="loading-spinner text-white"/><p className="text-xl text-white">{message}</p></div> );


// --- DASHBOARD ---
function PermissionsPanel({ patientAddress, onTransactionStart, onTransactionEnd, forceUpdate }) {
    const [permissions, setPermissions] = useState({});

    const fetchPermissions = useCallback(async () => {
        try {
            const contract = await getContract();
            const checks = doctorList.map(doc => contract.accessPermissions(patientAddress, doc.address));
            const results = await Promise.all(checks);
            const perms = {};
            doctorList.forEach((doc, i) => {
                perms[doc.address] = results[i];
            });
            setPermissions(perms);
        } catch (error) {
            console.error("Failed to fetch permissions:", error);
        }
    }, [patientAddress]);

    useEffect(() => {
        if (patientAddress) fetchPermissions();
    }, [patientAddress, fetchPermissions, forceUpdate]);

    const handlePermissionChange = async (doctorAddress, grant) => {
        onTransactionStart('Menunggu konfirmasi transaksi...');
        try {
            const contract = await getContract(true);
            const tx = await contract.manageAccess(doctorAddress, grant);
            await tx.wait();
            alert(`Berhasil ${grant ? 'memberikan' : 'mencabut'} akses!`);
            fetchPermissions(); // Refresh state
        } catch (error) {
            console.error("Error managing access:", error);
            alert("Transaksi gagal.");
        } finally {
            onTransactionEnd();
        }
    }

    return (
        <div className="side-panel">
            <h3>Kelola Izin Akses</h3>
            {doctorList.map(doctor => (
                <div key={doctor.address} className="permission-toggle">
                    <span>{doctor.name}</span>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={!!permissions[doctor.address]} onChange={(e) => handlePermissionChange(doctor.address, e.target.checked)} />
                        <span className="slider"></span>
                    </label>
                </div>
            ))}
        </div>
    );
}

function PatientDashboard({ user, onTransactionStart, onTransactionEnd, forceUpdate }) {
    const [records, setRecords] = useState([]);

    useEffect(() => {
        const fetchRecords = async () => {
            if (!user) return;
            onTransactionStart('Mengambil rekam medis Anda...');
            try {
                const contract = await getContract(true);
                const count = await contract.getRecordsCount(user.address);
                const recordsPromises = [];
                for (let i = 0; i < count; i++) {
                    recordsPromises.push(contract.getRecordByIndex(user.address, i));
                }
                const fetchedRecords = await Promise.all(recordsPromises);
                setRecords(fetchedRecords);
            } catch (error) {
                console.error("Failed to fetch records:", error);
                alert("Tidak dapat mengambil rekam medis Anda. Pastikan Anda login dengan akun yang benar di MetaMask.");
            } finally {
                onTransactionEnd();
            }
        };
        fetchRecords();
    }, [user, onTransactionStart, onTransactionEnd, forceUpdate]);

    return (
        <div className="dashboard-layout">
            <div className="main-panel">
                <h2>Rekam Medis Anda</h2>
                {records.length > 0 ? records.map((rec, i) => <RecordCard key={i} record={rec} index={i} />) : <p>Belum ada rekam medis.</p>}
            </div>
            <PermissionsPanel patientAddress={user.address} onTransactionStart={onTransactionStart} onTransactionEnd={onTransactionEnd} forceUpdate={forceUpdate} />
        </div>
    );
}

function DoctorDashboard({ user, onTransactionStart, onTransactionEnd, forceUpdate }) {
    const [selectedPatientAddr, setSelectedPatientAddr] = useState(null);
    const [records, setRecords] = useState([]);
    const [hasAccess, setHasAccess] = useState(false);
    const [newDiagnosis, setNewDiagnosis] = useState('');

    useEffect(() => {
        const checkAccessAndFetchRecords = async () => {
            if (!selectedPatientAddr || !user) return;
            onTransactionStart('Mengecek akses & mengambil rekam medis...');
            try {
                const contract = await getContract(true);
                const access = await contract.accessPermissions(selectedPatientAddr, user.address);
                setHasAccess(access);

                if (access) {
                    const count = await contract.getRecordsCount(selectedPatientAddr);
                    const recordsPromises = Array.from({ length: Number(count) }, (_, i) => contract.getRecordByIndex(selectedPatientAddr, i));
                    const fetchedRecords = await Promise.all(recordsPromises);
                    setRecords(fetchedRecords);
                } else {
                    setRecords([]);
                }
            } catch (error) {
                console.error("Failed to check access or fetch records:", error);
                 alert("Tidak dapat mengambil rekam medis pasien. Pasien mungkin perlu memberikan Anda akses terlebih dahulu.");
            } finally {
                onTransactionEnd();
            }
        };
        checkAccessAndFetchRecords();
    }, [selectedPatientAddr, user, onTransactionStart, onTransactionEnd, forceUpdate]);
    
    const handleAddRecord = async (e) => {
        e.preventDefault();
        if (!newDiagnosis.trim()) return;
        onTransactionStart('Menambahkan rekam medis baru ke blockchain...');
        try {
            const contract = await getContract(true);
            const tx = await contract.addRecord(selectedPatientAddr, newDiagnosis, `0x${crypto.randomUUID().replace(/-/g, '')}`);
            await tx.wait();
            alert("Rekam medis berhasil ditambahkan!");
            setNewDiagnosis('');
            setSelectedPatientAddr(addr => `${addr}`); // Memaksa re-fetch
        } catch(error) {
            console.error("Failed to add record:", error);
            alert("Gagal menambahkan rekam medis.");
        } finally {
            onTransactionEnd();
        }
    };


    return (
        <div className="doctor-dashboard">
            <div className="patient-list-panel">
                <h3>Daftar Pasien</h3>
                {patientList.map(p => (
                    <button key={p.address} onClick={() => setSelectedPatientAddr(p.address)} className={`patient-button ${selectedPatientAddr === p.address ? 'selected' : ''}`}>
                        <span>{p.name}</span> <ChevronRight />
                    </button>
                ))}
            </div>
            <div className="details-panel">
                {selectedPatientAddr ? (
                    <>
                        <h2>Rekam Medis: {userDatabase[selectedPatientAddr]?.name}</h2>
                        {hasAccess ? (
                            <>
                                {records.map((rec, i) => <RecordCard key={i} record={rec} index={i}/>)}
                                <form onSubmit={handleAddRecord} className="add-record-form">
                                    <h3>Tambah Catatan Medis Baru</h3>
                                    <textarea value={newDiagnosis} onChange={e => setNewDiagnosis(e.target.value)} placeholder="Tulis diagnosis..."/>
                                    <button type="submit" className="add-record-button" disabled={!newDiagnosis.trim()}>Tambahkan ke Blockchain</button>
                                </form>
                            </>
                        ) : (
                            <div className="access-denied-card">
                                <XCircle size={48} /><h3>Akses Ditolak</h3><p>Anda memerlukan izin dari pasien.</p>
                            </div>
                        )}
                    </>
                ) : <p>Pilih pasien untuk melihat detailnya.</p>}
            </div>
        </div>
    );
}


// --- KOMPONEN UTAMA APP ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0);


  const handleTransactionStart = useCallback((message = '') => {
      setLoadingMessage(message);
      setLoading(true);
  }, []);
  
  const handleTransactionEnd = useCallback(() => {
      setLoading(false);
      setLoadingMessage('');
  }, []);

  const connectWallet = async () => {
    handleTransactionStart('Menghubungkan ke wallet...');
    try {
        if (typeof window.ethereum === 'undefined') throw new Error("MetaMask tidak ditemukan");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0].toLowerCase();
        const userData = userDatabase[address];
        if (!userData) throw new Error("Alamat wallet Anda tidak terdaftar. Silakan gunakan salah satu akun tes dari Hardhat.");
        setCurrentUser({ address, ...userData });
    } catch (error) {
        console.error("Failed to connect wallet:", error);
        alert(error.message);
    } finally {
        handleTransactionEnd();
    }
  };
  
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
            const address = accounts[0].toLowerCase();
            const userData = userDatabase[address];
            if(userData){
                setCurrentUser({address, ...userData})
            } else {
                setCurrentUser(null);
            }
        } else {
          setCurrentUser(null);
        }
        setForceUpdate(f => f + 1);
      });
    }
  }, []);


  return (
    <>
      <CustomStyles />
      {loading && <LoadingOverlay message={loadingMessage} />}
      <div className="app-container">
        {!currentUser ? (
          <ConnectWalletScreen onConnect={connectWallet} loading={loading} />
        ) : (
          <>
            <Header user={currentUser} onLogout={() => setCurrentUser(null)} />
            <main>
              {currentUser.role === 'patient' && <PatientDashboard user={currentUser} onTransactionStart={handleTransactionStart} onTransactionEnd={handleTransactionEnd} forceUpdate={forceUpdate} />}
              {currentUser.role === 'doctor' && <DoctorDashboard user={currentUser} onTransactionStart={handleTransactionStart} onTransactionEnd={handleTransactionEnd} forceUpdate={forceUpdate} />}
            </main>
          </>
        )}
      </div>
    </>
  );
}
