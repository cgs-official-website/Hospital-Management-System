import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, setDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, secondaryAuth } from '../../firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { showConfirm, showPopup } from '../../utils/popup';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, Edit2, Trash2, Mail, Phone, Shield, X, CheckCircle2 } from 'lucide-react';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const hospitalId = localStorage.getItem('hospitalId');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'doctor', // default
    specialization: '', // for doctors
    department: '',
  });

  useEffect(() => {
    if (!hospitalId) return;

    const q = query(collection(db, 'users'), where('hospitalId', '==', hospitalId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const staffList = [];
      querySnapshot.forEach((doc) => {
        staffList.push({ id: doc.id, ...doc.data() });
      });
      setStaff(staffList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospitalId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Create a temporary random password
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
      
      // 2. Create the user in Auth using the secondary app (so admin doesn't get logged out)
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, tempPassword);
      const uid = userCredential.user.uid;
      
      // 3. Log out of the secondary app immediately
      await signOut(secondaryAuth);
      
      // 4. Send the password reset email so the staff can set their own password
      await sendPasswordResetEmail(auth, formData.email);
      
      // 5. Store staff details in Firestore using the Auth UID
      await setDoc(doc(db, 'users', uid), {
        ...formData,
        hospitalId,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      
      showPopup('Staff added and invitation email sent!', 'success');
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', role: 'doctor', specialization: '', department: '' });
    } catch (error) {
      console.error("Error adding staff:", error);
      showPopup(error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    showConfirm("Are you sure you want to remove this staff member?", async () => {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        console.error("Error deleting staff: ", error);
      }
    });
  };

  const filteredStaff = staff.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const nameStr = s.name || '';
    const emailStr = s.email || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchLower) || 
                          emailStr.toLowerCase().includes(searchLower);
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const currentStaff = filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Staff Management</h1>
          <p className="text-slate-500 mt-1">Manage doctors, nurses, and administrative personnel.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <UserPlus size={20} /> Add Staff
        </button>
      </div>

      <div className="glass-panel p-6 flex flex-col">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search staff by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="input-field w-auto font-bold text-slate-600"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="doctor">Doctors</option>
              <option value="nurse">Nurses</option>
              <option value="pharmacist">Pharmacists</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-col border border-slate-200 rounded-2xl bg-white/50 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Staff Member</th>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Role & Dept</th>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Contact</th>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Status</th>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">Loading staff data...</td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">
                    <Users size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-lg">No staff members found</p>
                    <p className="text-sm">Click "Add Staff" to onboard your team.</p>
                  </td>
                </tr>
              ) : (
                currentStaff.map((member) => (
                  <tr key={member.id} className="border-b border-slate-100 hover:bg-sky-50/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center font-bold text-primary">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 capitalize">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.specialization || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg w-max capitalize mb-1 ${
                          member.role === 'doctor' ? 'bg-sky-100 text-sky-700' :
                          member.role === 'nurse' ? 'bg-emerald-100 text-emerald-700' :
                          member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {member.role}
                        </span>
                        <span className="text-sm text-slate-600 font-medium">{member.department || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          <span className="truncate max-w-[150px]">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          <span>{member.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-bold text-slate-700 capitalize">{member.status || 'Active'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-primary hover:bg-sky-50 rounded-lg transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(member.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 0 && (
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50/80 gap-4 shrink-0">
              <span className="text-sm font-medium text-slate-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} entries
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-100 hover:text-primary transition-colors disabled:hover:text-slate-600 disabled:hover:bg-transparent"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-100 hover:text-primary transition-colors disabled:hover:text-slate-600 disabled:hover:bg-transparent"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-[95%] md:max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Add New Staff Member</h2>
                  <p className="text-sm text-slate-500">Create credentials and assign a role.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field" 
                      placeholder="e.g. Dr. Jane Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field" 
                      placeholder="jane.doe@hospital.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                    <input 
                      type="text" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field" 
                      placeholder="+91 (00000) 000-0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Role</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                      <select 
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="input-field pl-12 appearance-none font-bold text-slate-700"
                      >
                        <option value="admin">Hospital Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="laboratorist">Laboratorist</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Department</label>
                    <input 
                      type="text" 
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="input-field" 
                      placeholder="e.g. Cardiology"
                    />
                  </div>

                  {formData.role === 'doctor' && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Specialization</label>
                      <input 
                        type="text" 
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        className="input-field" 
                        placeholder="e.g. Cardiologist"
                      />
                    </div>
                  )}

                </div>

                <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 flex items-start gap-3">
                  <Shield className="text-primary mt-0.5 shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Security Notice</h4>
                    <p className="text-xs text-slate-600 mt-1">An email will be sent to the staff member with instructions to set their password. They will be strictly bound to this hospital workspace.</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <UserPlus size={18} />
                    Onboard Staff
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffManagement;
