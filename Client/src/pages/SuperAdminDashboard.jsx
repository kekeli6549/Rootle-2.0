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
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchData = async () => {
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
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle dynamic dropdown behavior
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
      showToast("Staff Key Generated Successfully!", "success");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Generation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(key);
    showToast("Key copied to clipboard!", "success");
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5DC] relative overflow-hidden text-timber-800 p-8 md:p-12">
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ 
          backgroundImage: `url('https://www.transparenttextures.com/patterns/graphy.png')`,
          backgroundSize: '200px'
        }}
      />

      <main className="flex-1 max-w-5xl mx-auto z-10">
        <div className="flex justify-between items-center mb-10 border-b-4 border-timber-800 pb-6">
          <div>
            <p className="text-timber-500 font-display font-black uppercase text-[10px] tracking-[0.3em]">
              SYSTEM SECURITY PROTOCOL
            </p>
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-timber-800">
              Super Admin Gate.
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-block text-[10px] font-black uppercase tracking-wider bg-timber-800 text-gold-leaf px-3 py-1.5 rounded-lg">
              {user?.email || 'GOD MODE'}
            </span>
            <button 
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-timber-800 hover:bg-red-700 transition-colors shadow-[2px_2px_0px_0px_rgba(62,39,35,1)]"
            >
              Exit Gate
            </button>
          </div>
        </div>

        <div className="bg-white border-4 border-timber-800 p-6 md:p-8 rounded-[30px] shadow-[12px_12px_0px_0px_rgba(62,39,35,1)] mb-12">
          <h2 className="text-2xl font-display font-black mb-2">Create New Staff Key</h2>
          <p className="text-timber-600 font-bold text-xs uppercase tracking-wider mb-6">
            Generate cryptographic single-use keys for faculty onboarding.
          </p>

          <form onSubmit={handleGenerateKey} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-timber-600 mb-2">Privilege Level</label>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-[#F5F5DC] border-4 border-timber-800 px-4 py-3 rounded-xl font-display text-xs font-black focus:outline-none"
              >
                <option value="admin">Lecturers & Admins</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-timber-600 mb-2">Target Department</label>
              <select 
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                disabled={selectedRole === 'superadmin'}
                className="w-full bg-[#F5F5DC] border-4 border-timber-800 px-4 py-3 rounded-xl font-display text-xs font-black focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="bg-timber-800 text-gold-leaf py-4 rounded-xl font-display font-black text-xs uppercase tracking-widest border-4 border-gold-leaf shadow-[4px_4px_0px_0px_rgba(191,149,63,1)] hover:shadow-none transition-all disabled:opacity-50"
            >
              {loading ? "Forging Key..." : "Generate Key"}
            </motion.button>
          </form>
        </div>

        <div className="bg-white border-4 border-timber-800 p-6 md:p-8 rounded-[30px] shadow-[12px_12px_0px_0px_rgba(62,39,35,1)]">
          <h2 className="text-2xl font-display font-black mb-6">Active & Historical Keys</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-timber-800 text-[10px] font-black uppercase tracking-widest text-timber-500">
                  <th className="py-3 px-4">Key Token</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-timber-200 font-medium text-xs">
                {staffKeys.length > 0 ? (
                  staffKeys.map(k => {
                    const isExpired = new Date() > new Date(k.expires_at);
                    return (
                      <tr key={k._id} className="hover:bg-timber-100/50 transition-colors">
                        <td className="py-4 px-4 font-mono font-black text-timber-800">{k.key}</td>
                        <td className="py-4 px-4 font-bold uppercase">{k.department_id?.name || 'System Wide'}</td>
                        <td className="py-4 px-4 uppercase font-bold text-gold-leaf">
                          {k.role === 'admin' ? 'Lecturers & Admins' : k.role}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                            k.is_used ? 'bg-gray-200 text-gray-700' : isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'
                          }`}>
                            {k.is_used ? 'Used' : isExpired ? 'Expired' : 'Active'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-timber-500">{new Date(k.expires_at).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-right">
                          {!k.is_used && !isExpired && (
                            <button 
                              onClick={() => copyToClipboard(k.key)}
                              className="bg-timber-800 text-gold-leaf px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-timber-700 transition-colors"
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
                    <td colSpan="6" className="text-center py-12 text-timber-400 font-bold uppercase text-xs tracking-widest">
                      No staff keys generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

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