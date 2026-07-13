import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, LogOut, Menu, Lock, Clock, CheckCircle2, ChevronRight, Activity,
  Settings, Users, UserPlus, FileText, ClipboardList, Stethoscope, Briefcase, Calendar, CheckSquare, Shield,
  CreditCard, PieChart, MessageSquare, Bell, Eye, Link, Building2, Pill, Syringe, HeartPulse, Bed,
  Package, ShoppingCart, AlertCircle, RefreshCw, Barcode, Printer, UserCheck, MonitorPlay, Ticket, ShieldCheck, Search, UsersRound, FileSignature, X, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Modules (Feature-Sliced Design)
// SUPERADMIN
import VendorOnboarding from '../features/superadmin/VendorOnboarding';
import SubscriptionBilling from '../features/superadmin/SubscriptionBilling';
import MultiTenantConfig from '../features/superadmin/MultiTenantConfig';
import ModuleToggle from '../features/superadmin/ModuleToggle';
import GlobalRoleManagement from '../features/superadmin/GlobalRoleManagement';
import PaymentGateway from '../features/superadmin/PaymentGateway';
import VendorUsage from '../features/superadmin/VendorUsage';
import GlobalAnalytics from '../features/superadmin/GlobalAnalytics';
import SupportTicket from '../features/superadmin/SupportTicket';
import NotificationTemplates from '../features/superadmin/NotificationTemplates';
import AuditLogs from '../features/superadmin/AuditLogs';
import CMSLandingPage from '../features/superadmin/CMSLandingPage';
import APIIntegration from '../features/superadmin/APIIntegration';

// ADMIN
import HospitalProfile from '../features/admin/HospitalProfile';
import StaffManagement from '../features/admin/StaffManagement';
import DepartmentManagement from '../features/admin/DepartmentManagement';
import AppointmentScheduling from '../features/admin/AppointmentScheduling';
import PatientRecords from '../features/admin/PatientRecords';
import OPDManagement from '../features/admin/OPDManagement';
import IPDManagement from '../features/admin/IPDManagement';
import Prescriptions from '../features/admin/Prescriptions';
import LabTestManagement from '../features/admin/LabTestManagement';
import HospitalBilling from '../features/admin/HospitalBilling';
import DutyRoster from '../features/admin/DutyRoster';
import HospitalReports from '../features/admin/HospitalReports';
import Telemedicine from '../features/admin/Telemedicine';
import MyAppointments from '../features/admin/MyAppointments';

// NURSE
import VitalsMonitoring from '../features/nurse/VitalsMonitoring';
import ADTManagement from '../features/nurse/ADTManagement';
import BedWardManagement from '../features/nurse/BedWardManagement';
import MARManagement from '../features/nurse/MARManagement';
import NurseNotes from '../features/nurse/NurseNotes';
import ShiftTaskManagement from '../features/nurse/ShiftTaskManagement';
import DoctorOrderTracking from '../features/nurse/DoctorOrderTracking';

// PHARMACIST
import PharmacyInventory from '../features/pharmacist/PharmacyInventory';
import PurchaseOrderManagement from '../features/pharmacist/PurchaseOrderManagement';
import PrescriptionDispensing from '../features/pharmacist/PrescriptionDispensing';
import StockAlerts from '../features/pharmacist/StockAlerts';
import MedicineBilling from '../features/pharmacist/MedicineBilling';
import StockAdjustment from '../features/pharmacist/StockAdjustment';
import BarcodeScanning from '../features/pharmacist/BarcodeScanning';
import PharmacyReports from '../features/pharmacist/PharmacyReports';

// RECEPTIONIST
import PatientRegistration from '../features/receptionist/PatientRegistration';
import Appointments from '../features/receptionist/Appointments';
import QueueManagement from '../features/receptionist/QueueManagement';
import PaymentCollection from '../features/receptionist/PaymentCollection';
import InsuranceClaim from '../features/receptionist/InsuranceClaim';
import PatientLookup from '../features/receptionist/PatientLookup';
import VisitorManagement from '../features/receptionist/VisitorManagement';

// STAFF (Shared/Attendance)
import AttendanceTracker from '../features/staff/AttendanceTracker';
import SettingsConfiguration from '../features/shared/SettingsConfiguration';
import DoctorConsultations from '../features/shared/DoctorConsultations';

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(''); 
  const [userName, setUserName] = useState('');
  const [hospitalStatus, setHospitalStatus] = useState('active');
  const [hospitalId, setHospitalId] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalLogo, setHospitalLogo] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [activeModule, setActiveModule] = useState(null);
  const [disabledModules, setDisabledModules] = useState([]);
  
  // For Superadmin
  const [pendingHospitals, setPendingHospitals] = useState([]);
  const [activeHospitals, setActiveHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [showModuleSearch, setShowModuleSearch] = useState(false);
  const [pendingAppointmentsCount, setPendingAppointmentsCount] = useState(0);
  const [seenPendingCount, setSeenPendingCount] = useState(() => {
    return parseInt(localStorage.getItem('seenPendingCount') || '0', 10);
  });

  useEffect(() => {
    let unsubscribeHospitals = null;
    let unsubscribeActive = null;
    let unsubscribeStatus = null;
    let unsubscribeAppointments = null;

    const setupDashboardData = async () => {
      const savedRole = localStorage.getItem('userRole');
      const savedHospitalId = localStorage.getItem('hospitalId');
      const savedUserName = localStorage.getItem('userName') || 'Current User';
      
      if (!savedRole) {
        navigate('/login');
        return;
      }
      
      setRole(savedRole);
      setUserName(savedUserName);
      setHospitalId(savedHospitalId);

      if (savedRole === 'superadmin') {
        const qPending = query(collection(db, 'hospitals'), where('status', '==', 'pending'));
        unsubscribeHospitals = onSnapshot(qPending, (querySnapshot) => {
          const hospitals = [];
          querySnapshot.forEach((doc) => hospitals.push({ id: doc.id, ...doc.data() }));
          setPendingHospitals(hospitals);
          setLoading(false);
        });

        const qActive = query(collection(db, 'hospitals'), where('status', '==', 'active'));
        unsubscribeActive = onSnapshot(qActive, (querySnapshot) => {
          const hospitals = [];
          querySnapshot.forEach((doc) => hospitals.push({ id: doc.id, ...doc.data() }));
          setActiveHospitals(hospitals);
        });
      } else if (savedHospitalId) {
        unsubscribeStatus = onSnapshot(doc(db, 'hospitals', savedHospitalId), (hospDoc) => {
          if (hospDoc.exists()) {
            setHospitalStatus(hospDoc.data().status);
            setDisabledModules(hospDoc.data().disabledModules || []);
            setHospitalName(hospDoc.data().hospitalName || 'Zuna Workspace');
            setHospitalLogo(hospDoc.data().logoBase64 || '');
          }
          setLoading(false);
        });

        const savedUserId = localStorage.getItem('userId');
        let qAppts;
        if (savedRole === 'doctor') {
          qAppts = query(collection(db, 'appointments'), where('hospitalId', '==', savedHospitalId), where('doctorId', '==', savedUserId), where('status', '==', 'scheduled'));
        } else {
          qAppts = query(collection(db, 'appointments'), where('hospitalId', '==', savedHospitalId), where('status', '==', 'pending'));
        }

        unsubscribeAppointments = onSnapshot(qAppts, (snap) => {
          setPendingAppointmentsCount(snap.size);
        });
      } else {
        setLoading(false);
      }
    };

    setupDashboardData();

    return () => {
      if (unsubscribeHospitals) unsubscribeHospitals();
      if (unsubscribeActive) unsubscribeActive();
      if (unsubscribeStatus) unsubscribeStatus();
      if (unsubscribeAppointments) unsubscribeAppointments();
    };
  }, [navigate]);

  useEffect(() => {
    const isApptModule = activeModule === 'Appointment & Scheduling' || 
                         activeModule === 'Front Desk Appointment' || 
                         activeModule === 'My Appointments';
                         
    if (isApptModule) {
      setSeenPendingCount(pendingAppointmentsCount);
      localStorage.setItem('seenPendingCount', pendingAppointmentsCount);
    } else if (pendingAppointmentsCount < seenPendingCount) {
      setSeenPendingCount(pendingAppointmentsCount);
      localStorage.setItem('seenPendingCount', pendingAppointmentsCount);
    }
  }, [activeModule, pendingAppointmentsCount, seenPendingCount]);

  useEffect(() => {
    if (role === 'superadmin') {
      document.title = "ZUNA - Enterprise Health System";
    } else if (hospitalName) {
      document.title = `${hospitalName} - ZUNA`;
    }
  }, [role, hospitalName]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleApprove = async (hospId) => {
    try {
      await updateDoc(doc(db, 'hospitals', hospId), { status: 'active' });
    } catch (error) {
      console.error("Error approving hospital: ", error);
    }
  };

  const moduleShortNames = {
    'Vendor Onboarding & Approval': 'Vendors',
    'Subscription Plans & Billing': 'Subscriptions',
    'Multi-Tenant Configuration': 'Tenants',
    'Module/Feature Toggle': 'Modules',
    'Global Role & Permission': 'Roles',
    'Payment Gateway & Revenue': 'Revenue',
    'Usage & License Management': 'Licenses',
    'Global Analytics & Dashboard': 'Analytics',
    'Support Ticket Helpdesk': 'Support',
    'Notification Templates': 'Notifications',
    'Audit Logs & Security': 'Logs',
    'CMS for Landing Page': 'CMS',
    'API & Integration': 'API',
    'Hospital Profile': 'Profile',
    'Doctor & Staff Management': 'Staff',
    'Department & Specialization': 'Departments',
    'Appointment & Scheduling': 'Appointments',
    'Electronic Medical Records': 'EMR',
    'OPD Management': 'OPD',
    'IPD Management': 'IPD',
    'Doctor Consultation': 'Consultations',
    'Lab & Diagnostic Orders': 'Labs',
    'Billing & Invoicing': 'Billing',
    'Duty Roster & Leave': 'Roster',
    'Hospital Reports': 'Reports',
    'Telemedicine': 'Telemedicine',
    'Patient Vitals Monitoring': 'Vitals',
    'Admission / Discharge (ADT)': 'ADT',
    'Bed & Ward Management': 'Beds',
    'Medication Admin Record': 'MAR',
    'Nurse Notes & Care Plan': 'Notes',
    'Shift & Task Management': 'Tasks',
    'Doctor Order Tracking': 'Orders',
    'Pharmacy Inventory': 'Inventory',
    'Purchase Order & Supplier': 'Purchases',
    'Prescription Dispensing': 'Dispensing',
    'Low Stock & Expiry Alerts': 'Alerts',
    'Medicine Billing': 'Billing',
    'Stock Adjustments': 'Adjustments',
    'Barcode Scanning': 'Barcode',
    'Pharmacy Reports': 'Reports',
    'Patient Registration': 'Registration',
    'Front Desk Appointment': 'Appointments',
    'Queue Management': 'Queue',
    'Payment Collection': 'Payments',
    'Insurance & Claim Assist': 'Insurance',
    'Patient Lookup': 'Patients',
    'Visitor Management': 'Visitors',
    'My Appointments': 'Appointments',
    'Patient History': 'History',
    'My Attendance': 'Attendance',
    'Settings Configuration': 'Settings'
  };

  // ZUNA ENTERPRISE MODULE DEFINITIONS
  const roleModules = {
    superadmin: [
      'Vendor Onboarding & Approval', 'Subscription Plans & Billing', 'Multi-Tenant Configuration',
      'Module/Feature Toggle', 'Global Role & Permission', 'Payment Gateway & Revenue',
      'Usage & License Management', 'Global Analytics & Dashboard', 'Support Ticket Helpdesk',
      'Notification Templates', 'Audit Logs & Security', 'CMS for Landing Page', 'API & Integration'
    ],
    admin: [
      'Hospital Profile', 'Doctor & Staff Management', 'Department & Specialization',
      'Appointment & Scheduling', 'Electronic Medical Records', 'OPD Management',
      'IPD Management', 'Doctor Consultation', 'Lab & Diagnostic Orders',
      'Billing & Invoicing', 'Duty Roster & Leave', 'Hospital Reports', 'Telemedicine'
    ],
    nurse: [
      'Patient Vitals Monitoring', 'Admission / Discharge (ADT)', 'Bed & Ward Management',
      'Medication Admin Record', 'Nurse Notes & Care Plan', 'Shift & Task Management',
      'Doctor Order Tracking'
    ],
    pharmacist: [
      'Pharmacy Inventory', 'Purchase Order & Supplier', 'Prescription Dispensing',
      'Low Stock & Expiry Alerts', 'Medicine Billing', 'Stock Adjustments',
      'Barcode Scanning', 'Pharmacy Reports'
    ],
    receptionist: [
      'Patient Registration', 'Front Desk Appointment', 'Queue Management',
      'Payment Collection', 'Insurance & Claim Assist', 'Patient Lookup', 'Visitor Management'
    ],
    doctor: [
      'My Appointments', 'Patient History', 'Doctor Consultation'
    ],
    staff: [
      'My Attendance', 'Settings Configuration'
    ]
  };

  const iconMap = {
    'Vendor Onboarding & Approval': UserPlus, 'Subscription Plans & Billing': CreditCard, 'Multi-Tenant Configuration': Building2,
    'Module/Feature Toggle': Settings, 'Global Role & Permission': Shield, 'Payment Gateway & Revenue': PieChart,
    'Usage & License Management': FileText, 'Global Analytics & Dashboard': Activity, 'Support Ticket Helpdesk': MessageSquare,
    'Notification Templates': Bell, 'Audit Logs & Security': ShieldCheck, 'CMS for Landing Page': Eye, 'API & Integration': Link,
    'Hospital Profile': Building2, 'Doctor & Staff Management': Users, 'Department & Specialization': Briefcase,
    'Appointment & Scheduling': Calendar, 'Electronic Medical Records': ClipboardList, 'Patient History': ClipboardList,
    'OPD Management': Stethoscope, 'IPD Management': Bed, 'Doctor Consultation': FileSignature, 'Lab & Diagnostic Orders': Syringe,
    'Billing & Invoicing': CreditCard, 'Duty Roster & Leave': Calendar, 'Hospital Reports': PieChart, 'Telemedicine': MonitorPlay,
    'Patient Vitals Monitoring': HeartPulse, 'Admission / Discharge (ADT)': UserCheck, 'Bed & Ward Management': Bed,
    'Medication Admin Record': Pill, 'Nurse Notes & Care Plan': ClipboardList, 'Shift & Task Management': CheckSquare,
    'Doctor Order Tracking': FileText, 'Pharmacy Inventory': Package, 'Purchase Order & Supplier': ShoppingCart,
    'Prescription Dispensing': Pill, 'Low Stock & Expiry Alerts': AlertCircle, 'Medicine Billing': CreditCard,
    'Stock Adjustments': RefreshCw, 'Barcode Scanning': Barcode, 'Pharmacy Reports': Printer, 'Patient Registration': UserPlus,
    'Front Desk Appointment': Calendar, 'Queue Management': Ticket, 'Payment Collection': CreditCard, 'Insurance & Claim Assist': ShieldCheck,
    'Patient Lookup': Search, 'Visitor Management': UsersRound, 'My Attendance': CheckSquare, 'Settings Configuration': Settings, 'My Appointments': Calendar
  };

  const currentModules = (roleModules[role] || []).filter(mod => !disabledModules.includes(mod));

  const filteredSearchModules = currentModules.filter(mod => 
    mod.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
    (moduleShortNames[mod] && moduleShortNames[mod].toLowerCase().includes(moduleSearchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-50 flex overflow-hidden">
        <div className="w-[280px] bg-white border-r border-slate-200 flex flex-col h-full hidden md:flex p-6">
          <div className="h-8 bg-slate-200 rounded-lg mb-8 w-2/3 animate-pulse"></div>
          <div className="h-16 bg-slate-100 rounded-2xl mb-6 w-full animate-pulse"></div>
          <div className="space-y-3 flex-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse w-full"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col h-screen">
          <div className="h-[80px] bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
            <div className="h-10 bg-slate-100 rounded-xl w-64 animate-pulse"></div>
            <div className="flex gap-4">
              <div className="h-10 w-10 bg-slate-100 rounded-xl animate-pulse"></div>
              <div className="h-11 w-11 bg-slate-100 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="h-10 bg-slate-200 rounded-lg mb-4 w-1/3 animate-pulse"></div>
            <div className="h-6 bg-slate-100 rounded-lg mb-8 w-1/4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-28 bg-white border border-slate-100 shadow-sm rounded-2xl animate-pulse flex flex-col justify-center p-5">
                  <div className="h-10 w-10 bg-slate-100 rounded-lg mb-3 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role !== 'superadmin' && hospitalStatus === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface relative overflow-hidden">
        <div className="absolute inset-0 flex justify-center items-center opacity-5 pointer-events-none">
          <Lock size={400} />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel max-w-lg w-full p-10 text-center z-10">
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 shadow-soft">
            <Clock className="text-orange-500" size={40} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Workspace Frozen</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Your hospital registration is currently <strong>pending approval</strong> from our Superadmin team. 
            For security and verification purposes, all modules remain locked until approval is granted.
          </p>
          <button onClick={handleLogout} className="btn-secondary w-full flex items-center justify-center gap-2">
            <LogOut size={18} /> Logout
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Massive Enterprise Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className={`bg-white border-r border-slate-200 flex flex-col shadow-xl text-slate-700 h-full overflow-hidden z-40
          ${isSidebarOpen ? 'fixed inset-y-0 left-0 md:relative' : 'hidden md:flex md:relative'}
        `}
      >
        <div className={`p-6 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} border-b border-slate-100 h-[80px]`}>
          {isSidebarOpen && <span className="font-extrabold tracking-tight text-2xl text-slate-900 flex items-center gap-2"><img src="/zuna-logo.png" alt="ZUNA" className="w-8 h-8 object-contain" /> ZUNA</span>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-slate-800 transition-colors md:hidden">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Workspace Badge (Fixed) */}
        {isSidebarOpen && (
          <div className="px-4 pt-4 shrink-0">
            <div className="p-3 bg-white border border-slate-100 rounded-[1.25rem] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                {hospitalLogo ? (
                  <img src={hospitalLogo} alt="Hospital" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={20} className="text-slate-500" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-slate-800 text-[13px] truncate">{role === 'superadmin' ? 'Zuna Global HQ' : hospitalName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
          
          <div className="space-y-1">
            <button 
              onClick={() => {
                setActiveModule(null);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-[12px] transition-all cursor-pointer relative ${!activeModule ? 'text-primary font-bold before:content-[\'\'] before:absolute before:left-[-12px] before:top-[8px] before:bottom-[8px] before:w-1.5 before:bg-primary before:rounded-r-md' : 'hover:bg-slate-50 hover:text-primary text-slate-500 font-medium'}`}
            >
              <LayoutDashboard size={20} className={!activeModule ? "text-primary" : "text-slate-400"} />
              {isSidebarOpen && <span className="text-sm truncate">Overview Dashboard</span>}
            </button>

            {currentModules.map((mod, idx) => {
              const ModIcon = iconMap[mod] || ChevronRight;
              const unreadCount = pendingAppointmentsCount - seenPendingCount;
              const isApptModule = mod === 'Appointment & Scheduling' || mod === 'Front Desk Appointment' || mod === 'My Appointments';
              const hasNotification = isApptModule && unreadCount > 0;
              return (
                <button 
                  key={idx} 
                  onClick={() => {
                    setActiveModule(mod);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-[12px] transition-all cursor-pointer relative ${activeModule === mod ? 'text-primary font-bold before:content-[\'\'] before:absolute before:left-[-12px] before:top-[8px] before:bottom-[8px] before:w-1.5 before:bg-primary before:rounded-r-md' : 'hover:bg-slate-50 hover:text-primary text-slate-500 font-medium'}`}
                  title={moduleShortNames[mod] || mod}
                >
                  <ModIcon size={20} className={activeModule === mod ? "text-primary" : "text-slate-400"} />
                  {isSidebarOpen && <span className="text-sm truncate text-left">{moduleShortNames[mod] || mod}</span>}
                  {hasNotification && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadCount}
                    </span>
                  )}
                  {!isSidebarOpen && hasNotification && (
                    <span className="absolute right-1 top-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col justify-end mt-auto">
          {/* User Profile Footer */}
          <div className="p-4 border-t border-slate-100 flex flex-col justify-end">
          {isSidebarOpen ? (
            <div className="flex items-center justify-between w-full bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center overflow-hidden shadow-sm font-bold text-lg uppercase">
                  {userName ? userName[0] : role[0]}
                </div>
                <div className="flex flex-col text-left min-w-0 pr-2">
                  <span className="font-bold text-sm text-slate-800 truncate leading-tight">{userName || "Admin"}</span>
                  <span className="text-[10px] text-primary font-extrabold uppercase tracking-wider truncate">{role?.replace('_', ' ') || "ADMIN"}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full h-12 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-[80px] bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10 shadow-sm relative">
          <div className="flex items-center gap-2 md:hidden min-w-0 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 hover:text-primary rounded-lg transition-colors shrink-0">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 overflow-hidden">
              {hospitalLogo ? (
                <img src={hospitalLogo} alt="Hospital Logo" className="w-7 h-7 object-cover rounded-md shrink-0 border border-slate-200" />
              ) : (
                <img src="/zuna-logo.png" alt="Logo" className="w-7 h-7 object-contain shrink-0" />
              )}
              <span className="font-extrabold text-lg text-slate-900 truncate">
                {role === 'superadmin' ? 'Zuna HQ' : (hospitalName || "ZUNA")}
              </span>
            </div>
          </div>

          <div className="relative w-full max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search modules..." 
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary focus:ring-[3px] focus:ring-primary/20 outline-none transition-all shadow-inner-soft text-slate-700 font-medium placeholder:text-slate-400"
                value={moduleSearchQuery}
                onChange={(e) => {
                  setModuleSearchQuery(e.target.value);
                  setShowModuleSearch(true);
                }}
                onFocus={() => setShowModuleSearch(true)}
                onBlur={() => setTimeout(() => setShowModuleSearch(false), 200)}
              />
              {moduleSearchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  onClick={() => {
                    setModuleSearchQuery('');
                    setShowModuleSearch(false);
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {showModuleSearch && moduleSearchQuery.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 z-[999] max-h-[350px] overflow-y-auto custom-scrollbar overflow-hidden">
                {filteredSearchModules.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredSearchModules.map((mod, idx) => {
                      const ModIcon = iconMap[mod] || ChevronRight;
                      return (
                        <button 
                          key={idx}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-sky-50 rounded-xl text-left transition-all group"
                          onClick={() => {
                            setActiveModule(mod);
                            setModuleSearchQuery('');
                            setShowModuleSearch(false);
                          }}
                        >
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm group-hover:shadow-[0_4px_10px_rgba(38,166,137,0.3)]">
                            <ModIcon size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-700 text-sm group-hover:text-primary transition-colors truncate">{moduleShortNames[mod] || mod}</p>
                            <p className="text-[11px] text-slate-500 truncate">{mod}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 flex flex-col items-center text-center text-slate-500 text-sm">
                    <Search className="mb-2 text-slate-300" size={32} />
                    <p className="font-bold text-slate-600 mb-1">No modules found</p>
                    <p className="text-xs">No matching module for "{moduleSearchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-11 h-11 rounded-xl bg-slate-50 text-slate-500 hover:text-primary hover:bg-sky-50 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 shadow-sm"
              title="Refresh System"
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={() => {
                if (roleModules[role]?.includes('Hospital Profile')) {
                  setActiveModule('Hospital Profile');
                } else if (roleModules[role]?.includes('Global Analytics')) {
                  setActiveModule('Global Analytics');
                }
              }}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center overflow-hidden shadow-md border-2 border-primary/20 hover:border-primary transition-colors cursor-pointer font-bold text-lg uppercase"
              title="My Profile"
            >
              {userName ? userName[0] : role[0]}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
          
          {/* SUPERADMIN DASHBOARD VIEW */}
          {!activeModule && role === 'superadmin' && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Pending Approvals</h2>
                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">{pendingHospitals.length} Requests</span>
              </div>
              {pendingHospitals.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
                  <CheckCircle2 size={40} className="mx-auto mb-3 text-green-400" />
                  No pending hospital requests.
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingHospitals.map(hosp => (
                    <div key={hosp.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">{hosp.hospitalName}</h3>
                        <p className="text-sm text-slate-500">Chief Doctor: {hosp.chiefDoctorName} | Admin: {hosp.adminEmail}</p>
                        {hosp.patientCount !== undefined && (
                          <div className="flex flex-wrap gap-3 mt-2 text-xs font-semibold">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                              Patients: {hosp.patientCount} / month
                            </span>
                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                              Est. Pricing: ₹{(hosp.estimatedPrice || 0).toLocaleString('en-IN')}/month
                            </span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleApprove(hosp.id)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm">
                        Approve Workspace
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVE MODULE RENDERER */}
          {activeModule ? (
            <div className="h-full">
              {(() => {
                switch (activeModule) {
                  // SUPERADMIN
                  case 'Vendor Onboarding & Approval': return <VendorOnboarding />;
                  case 'Subscription Plans & Billing': return <SubscriptionBilling />;
                  case 'Multi-Tenant Configuration': return <MultiTenantConfig />;
                  case 'Module/Feature Toggle': return <ModuleToggle />;
                  case 'Global Role & Permission': return <GlobalRoleManagement />;
                  case 'Payment Gateway & Revenue': return <PaymentGateway />;
                  case 'Usage & License Management': return <VendorUsage />;
                  case 'Global Analytics & Dashboard': return <GlobalAnalytics />;
                  case 'Support Ticket Helpdesk': return <SupportTicket />;
                  case 'Notification Templates': return <NotificationTemplates />;
                  case 'Audit Logs & Security': return <AuditLogs />;
                  case 'CMS for Landing Page': return <CMSLandingPage />;
                  case 'API & Integration': return <APIIntegration />;

                  // ADMIN / DOCTOR
                  case 'Hospital Profile': return <HospitalProfile />;
                  case 'Doctor & Staff Management': return <StaffManagement />;
                  case 'Department & Specialization': return <DepartmentManagement />;
                  case 'Appointment & Scheduling': return <AppointmentScheduling />;
                  case 'Electronic Medical Records': return <PatientRecords />;
                  case 'OPD Management': return <OPDManagement />;
                  case 'IPD Management': return <IPDManagement />;
                  case 'Doctor Consultation': return <DoctorConsultations viewMode="all" />;
                  case 'Lab & Diagnostic Orders': return <LabTestManagement />;
                  case 'Billing & Invoicing': return <HospitalBilling />;
                  case 'Duty Roster & Leave': return <DutyRoster />;
                  case 'Hospital Reports': return <HospitalReports />;
                  case 'Telemedicine': return <Telemedicine />;

                  // DOCTOR
                  case 'My Appointments': return <MyAppointments />;
                  case 'Patient History': return <DoctorConsultations viewMode="history" />;

                  // NURSE
                  case 'Patient Vitals Monitoring': return <VitalsMonitoring />;
                  case 'Admission / Discharge (ADT)': return <ADTManagement />;
                  case 'Bed & Ward Management': return <BedWardManagement />;
                  case 'Medication Admin Record': return <MARManagement />;
                  case 'Nurse Notes & Care Plan': return <NurseNotes />;
                  case 'Shift & Task Management': return <ShiftTaskManagement />;
                  case 'Doctor Order Tracking': return <DoctorOrderTracking />;

                  // PHARMACIST
                  case 'Pharmacy Inventory': return <PharmacyInventory />;
                  case 'Purchase Order & Supplier': return <PurchaseOrderManagement />;
                  case 'Prescription Dispensing': return <PrescriptionDispensing />;
                  case 'Low Stock & Expiry Alerts': return <StockAlerts />;
                  case 'Medicine Billing': return <MedicineBilling />;
                  case 'Stock Adjustments': return <StockAdjustment />;
                  case 'Barcode Scanning': return <BarcodeScanning />;
                  case 'Pharmacy Reports': return <PharmacyReports />;

                  // RECEPTIONIST
                  case 'Patient Registration': return <PatientRegistration />;
                  case 'Front Desk Appointment': return <Appointments />;
                  case 'Queue Management': return <QueueManagement />;
                  case 'Payment Collection': return <PaymentCollection />;
                  case 'Insurance & Claim Assist': return <InsuranceClaim />;
                  case 'Patient Lookup': return <PatientLookup />;
                  case 'Visitor Management': return <VisitorManagement />;

                  // STAFF
                  case 'My Attendance': return <AttendanceTracker />;
                  case 'Settings Configuration': return <SettingsConfiguration />;

                  default: return <div>Module Not Found</div>;
                }
              })()}
            </div>
          ) : (
            <>
              {/* DEFAULT DASHBOARD OVERVIEW */}
              <div className="mb-8 mt-4">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">ZUNA Modules Overview</h2>
                <p className="text-slate-500 text-lg">Select an enterprise module from the sidebar to begin.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {currentModules.map((mod, idx) => {
                  const ModIcon = iconMap[mod] || LayoutDashboard;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={idx} 
                      onClick={() => setActiveModule(mod)}
                      className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group flex flex-col items-start"
                    >
                      <div className="w-10 h-10 rounded-lg bg-sky-50 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ModIcon size={20} />
                      </div>
                      <h3 className="font-bold text-slate-700 mb-1 group-hover:text-primary transition-colors text-sm">{mod}</h3>
                    </motion.div>
                  );
                })}
              </div>

              {role === 'admin' && hospitalStatus === 'active' && (
                <div className="mt-12 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">ZUNA Staff Onboarding Link</h3>
                    <p className="text-sm text-slate-600">Share this unique URL with your staff to register their accounts under your workspace.</p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 font-mono text-sm text-slate-700 shadow-sm max-w-full overflow-x-auto whitespace-nowrap">
                    {window.location.origin}/{hospitalId}/register
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
