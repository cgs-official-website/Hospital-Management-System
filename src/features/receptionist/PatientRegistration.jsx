import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import Modal from '../../shared/components/Modal';

const PatientRegistration = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'Male',
    bloodGroup: 'O+',
    contact: '',
    medicalHistory: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'patients'), {
        ...formData,
        hospitalId,
        registeredAt: serverTimestamp()
      });
      setSuccess(true);
      setFormData({ name: '', dob: '', gender: 'Male', bloodGroup: 'O+', contact: '', medicalHistory: '' });
    } catch (error) {
      console.error("Error registering patient:", error);
      showPopup("Failed to register patient", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-sky-50 rounded-xl text-primary">
          <UserPlus size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Register Patient</h2>
          <p className="text-sm text-slate-500">Add a new patient to the hospital records.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
            <input required name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="Patient Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number *</label>
            <input required name="contact" value={formData.contact} onChange={handleChange} className="input-field" placeholder="+91 XXXXX XXXXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
            <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="input-field">
              <option>A+</option><option>A-</option>
              <option>B+</option><option>B-</option>
              <option>O+</option><option>O-</option>
              <option>AB+</option><option>AB-</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prior Medical History / Allergies</label>
          <textarea name="medicalHistory" value={formData.medicalHistory} onChange={handleChange} className="input-field min-h-[100px]" placeholder="Briefly describe any chronic conditions or allergies..."></textarea>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-4 text-lg">
          {loading ? 'Saving...' : 'Register Patient'}
        </button>
      </form>

      <Modal isOpen={success} onClose={() => setSuccess(false)} title="Success">
        <div className="text-center py-4">
          <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800">Patient Registered</h3>
          <p className="text-slate-500 mt-2">The patient has been successfully added to the system and can now be assigned to appointments.</p>
          <button onClick={() => setSuccess(false)} className="btn-primary w-full mt-6">Add Another Patient</button>
        </div>
      </Modal>
    </div>
  );
};

export default PatientRegistration;
