import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import Toast from '../components/Toast';

const SuperAdminDashboard = () => {
  const [departments, setDepartments] = useState([]);
  const [staffKeys, setStaffKeys] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin'); // Defaults to 'admin' (Lecturers & Admins)
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchData = async () => {
    setFetchingData(true);
    try {
      // Try /auth/departments first; fallback to /departments if mounted at root
      let deptRes = await API.get('/auth/departments').catch(() => null);
      if (!deptRes || !Array.isArray(deptRes.data) || deptRes.data.length === 0) {
        deptRes = await API.get('/departments').catch(() => ({ data: [] }));
      }
      
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);

      const keysRes = await API.get('/admin/staff-keys');
      setStaffKeys(Array.isArray(keysRes.data) ? keysRes.data : []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      showToast("Failed to fetch administrative records.", "error");
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Clear department selection when privilege level changes to superadmin
  useEffect(() => {
    if (selectedRole === 'superadmin') {
      setSelectedDept('');
    }
  }, [selectedRole]);

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    
    // Validation: Require department UNLESS role is superadmin
    if (selectedRole !== 'superadmin' && !selectedDept) {
      return showToast("Please select a target department", "error");
    }

    setLoading(true);
    try {
      await API.post('/admin/generate-staff-key', {
        department_id: selectedRole === 'superadmin' ? null : selectedDept,
        role: selectedRole
      });
      showToast("Staff Key Forged Successfully!", "success");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Key generation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (key) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    showToast(`Key "${key}" copied to clipboard!`, "success");
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5DC] relative overflow-hidden text-[#3E2723] p-6 md:p-12">
      {/* Background Graphic Pattern */}
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ 
          backgroundImage: `url('https://www.transparenttextures.com/patterns/graphy.png')`,
          backgroundSize: '200px'
        }}
      />

      <main className="flex-1 max-w-5xl mx-auto z-10">
        {/* Top Header Navigation */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b-4 border-[#3E2723] pb-6">
          <div>
            <span className="text-[#8D6E63] font-black uppercase text-[10px] tracking-[0.3em] block mb-1">
              SYSTEM SECURITY PROTOCOL
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#3E2723]">
              Super Admin Gate.
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user?.email && (
              <span className="hidden md:inline-block text-[10px] font-black uppercase tracking-wider bg-[#3E2723] text-[#C5A059] px-3.5 py-1.5 rounded-xl border-2 border-[#3E2723]">
                {user.email}
              </span>
            )}
            <button 
              onClick={handleLogout}
              aria-label="Exit Super Admin Gate and return to login"
              className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-[#3E2723] hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400 transition-colors shadow-[3px_3px_0px_0px_rgba(62,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Exit Gate
            </button>
          </div>
        </header>

        {/* Form: Generate Key */}
        <section 
          aria-labelledby="generate-key-heading"
          className="bg-white border-4 border-[#3E2723] p-6 md:p-8 rounded-[30px] shadow-[12px_12px_0px_0px_rgba(62,39,35,1)] mb-12"
        >
          <h2 id="generate-key-heading" className="text-2xl font-black text-[#3E2723] mb-2">
            Create New Staff Key
          </h2>
          <p className="text-[#5D4037] font-bold text-xs uppercase tracking-wider mb-6">
            Generate cryptographic single-use keys for faculty onboarding.
          </p>

          <form onSubmit={handleGenerateKey} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label 
                htmlFor="privilege-level" 
                className="block text-[10px] font-black uppercase tracking-widest text-[#5D4037] mb-2"
              >
                Privilege Level
              </label>
              <div className="relative">
                <select 
                  id="privilege-level"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-[#F5F5DC] border-4 border-[#3E2723] px-4 py-3 rounded-xl font-black text-xs appearance-none outline-none focus-visible:ring-4 focus-visible:ring-[#C5A059] cursor-pointer text-[#3E2723] pr-8"
                >
                  <option value="admin">Lecturers & Admins</option>
                  <option value="superadmin">Super Admin</option>
                </select>
                <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#3E2723] font-black text-xs">
                  ▼
                </div>
              </div>
            </div>

            <div>
              <label 
                htmlFor="target-department" 
                className="block text-[10px] font-black uppercase tracking-widest text-[#5D4037] mb-2"
              >
                Target Department
              </label>
              <div className="relative">
                <select 
                  id="target-department"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  disabled={selectedRole === 'superadmin'}
                  className="w-full bg-[#F5F5DC] border-4 border-[#3E2723] px-4 py-3 rounded-xl font-black text-xs appearance-none outline-none focus-visible:ring-4 focus-visible:ring-[#C5A059] cursor-pointer text-[#3E2723] pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedRole === 'superadmin' ? (
                    <option value="">-- SYSTEM WIDE --</option>
                  ) : (
                    <>
                      <option value="">-- SELECT DEPARTMENT --</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </>
                  )}
                </select>
                <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#3E2723] font-black text-xs">
                  ▼
                </div>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              aria-busy={loading}
              className="bg-[#3E2723] text-[#C5A059] py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-widest border-4 border-[#C5A059] shadow-[4px_4px_0px_0px_rgba(197,160,89,1)] hover:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C5A059] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Forging Key..." : "Generate Key"}
            </motion.button>
          </form>
        </section>

        {/* Section: Active & Historical Keys */}
        <section 
          aria-labelledby="keys-history-heading"
          className="bg-white border-4 border-[#3E2723] p-6 md:p-8 rounded-[30px] shadow-[12px_12px_0px_0px_rgba(62,39,35,1)]"
        >
          <h2 id="keys-history-heading" className="text-2xl font-black text-[#3E2723] mb-6">
            Active & Historical Keys
          </h2>
          
          {fetchingData ? (
            <div className="py-12 text-center" aria-live="polite">
              <p className="font-black text-[#3E2723] text-xs uppercase tracking-widest animate-pulse">
                Loading Cryptographic Security Logs...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" role="table">
                <caption className="sr-only">
                  List of active, used, and expired staff keys with department details and expiration dates
                </caption>
                <thead>
                  <tr className="border-b-4 border-[#3E2723] text-[10px] font-black uppercase tracking-widest text-[#8D6E63]">
                    <th scope="col" className="py-3 px-4">Key Token</th>
                    <th scope="col" className="py-3 px-4">Department</th>
                    <th scope="col" className="py-3 px-4">Role</th>
                    <th scope="col" className="py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4">Expires</th>
                    <th scope="col" className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#3E2723]/10 font-medium text-xs">
                  {staffKeys.length > 0 ? (
                    staffKeys.map(k => {
                      const isExpired = k.expires_at ? new Date() > new Date(k.expires_at) : false;
                      const statusLabel = k.is_used ? 'Used' : isExpired ? 'Expired' : 'Active';
                      const statusBg = k.is_used 
                        ? 'bg-gray-200 text-gray-800' 
                        : isExpired 
                        ? 'bg-red-100 text-red-800 border-2 border-red-800' 
                        : 'bg-green-100 text-green-900 border-2 border-green-800';

                      return (
                        <tr key={k._id} className="hover:bg-[#F5F5DC]/50 transition-colors">
                          <td className="py-4 px-4 font-mono font-black text-[#3E2723] select-all">
                            {k.key}
                          </td>
                          <td className="py-4 px-4 font-bold uppercase text-[#3E2723]">
                            {k.department_id?.name || 'System Wide'}
                          </td>
                          <td className="py-4 px-4 uppercase font-black text-[#A0522D]">
                            {k.role === 'admin' ? 'Lecturers & Admins' : k.role}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${statusBg}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-[#5D4037] font-bold">
                            {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {!k.is_used && !isExpired && (
                              <button 
                                onClick={() => copyToClipboard(k.key)}
                                aria-label={`Copy staff key ${k.key} to clipboard`}
                                className="bg-[#3E2723] text-[#C5A059] px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 border-[#3E2723] hover:bg-[#5D4037] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] transition-colors cursor-pointer"
                              >
                                Copy
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-[#8D6E63] font-bold uppercase text-xs tracking-widest">
                        No staff keys generated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Global Toast Announcements */}
      <Toast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, show: false }))} 
      />
    </div>
  );
};

export default SuperAdminDashboard;