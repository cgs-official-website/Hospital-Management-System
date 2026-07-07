import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, Check, Menu, X, Globe, HeartPulse } from 'lucide-react';
import Modal from '../shared/components/Modal';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'patient' only now
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handlePurchase = () => {
    navigate('/register-hospital');
  };

  const scrollToPlans = () => {
    document.getElementById('pricing-section').scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden">
      <div className="min-h-screen bg-slate-50 relative z-0">
        
        {/* Background Animated 3D Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none perspective-1000 bg-slate-100" style={{ perspective: 1000 }}>
          {/* 3D Moving Perspective Grid */}
          <div className="absolute bottom-[-20%] left-[-50%] w-[200%] h-[100%] border-t border-primary/20" 
               style={{
                 backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.15) 1px, transparent 1px)',
                 backgroundSize: '60px 60px',
                 transformOrigin: 'top',
                 transform: 'rotateX(75deg)'
               }}>
            <motion.div 
              animate={{ y: [0, 60] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-full h-full"
              style={{
                backgroundImage: 'inherit',
                backgroundSize: 'inherit'
              }}
            />
          </div>
          
          {/* Floating 3D Orbs */}
          <motion.div 
            animate={{ rotateX: 360, rotateY: 360, y: [0, -30, 0] }}
            transition={{ rotateX: { duration: 20, repeat: Infinity, ease: "linear" }, rotateY: { duration: 25, repeat: Infinity, ease: "linear" }, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
            className="absolute top-[20%] left-[15%] w-32 h-32 rounded-full border border-primary/30 shadow-[0_0_30px_rgba(14,165,233,0.3)]" 
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="absolute inset-0 rounded-full border border-accent/30 rotate-90 transform"></div>
            <div className="absolute inset-0 rounded-full border border-primary/30 rotate-45 transform"></div>
          </motion.div>

          <motion.div 
            animate={{ rotateX: -360, rotateY: 360, y: [0, 40, 0] }}
            transition={{ rotateX: { duration: 25, repeat: Infinity, ease: "linear" }, rotateY: { duration: 20, repeat: Infinity, ease: "linear" }, y: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}
            className="absolute top-[10%] right-[15%] w-48 h-48 rounded-full border border-accent/20 shadow-[0_0_40px_rgba(139,92,246,0.2)]" 
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="absolute inset-0 rounded-full border border-primary/20 rotate-90 transform"></div>
            <div className="absolute inset-0 rounded-full border border-accent/20 rotate-45 transform"></div>
          </motion.div>
          
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-100/80 to-slate-50" />
        </div>

        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 w-full z-50 border-b border-white/50 backdrop-blur-xl bg-white/90 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/zuna-logo.png" alt="ZUNA" className="w-8 h-8 object-contain" />
              <span className="font-extrabold tracking-tight text-2xl text-slate-900">ZUNA</span>
            </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-4 items-center">
            <button 
              onClick={() => navigate('/login')}
              className="text-slate-600 font-bold hover:text-primary transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button 
              onClick={() => openModal('patient')}
              className="btn-secondary"
            >
              Book Appointment
            </button>
            <button 
              onClick={scrollToPlans}
              className="btn-primary shadow-lg shadow-primary/30"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-2 text-slate-600 hover:text-primary transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-[72px] left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-4 z-40 flex flex-col gap-3 shadow-xl md:hidden"
            >
              <button 
                onClick={() => navigate('/login')}
                className="w-full text-center text-slate-700 font-bold py-3 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); openModal('patient'); }}
                className="btn-secondary w-full"
              >
                Book Appointment
              </button>
              <button 
                onClick={scrollToPlans}
                className="btn-primary w-full shadow-lg shadow-primary/30"
              >
                Get Started
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 text-center relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full bg-white shadow-sm border border-primary/10 text-primary font-bold text-sm tracking-wide">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              The Next-Generation Medical OS
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
              Run your hospital on a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">unified platform.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl leading-relaxed mx-auto font-medium">
              ZUNA brings powerful superadmin controls, multi-tenant architecture, and seamless clinical workflows into one beautiful interface.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
              <button onClick={scrollToPlans} className="btn-primary flex items-center justify-center gap-2 text-lg px-8 py-4 shadow-xl shadow-primary/30 rounded-2xl w-full sm:w-auto hover:scale-105 transition-transform duration-300">
                Transform Your Hospital <ArrowRight size={20} />
              </button>
              <button onClick={() => navigate('/login')} className="btn-secondary flex items-center justify-center text-lg px-8 py-4 rounded-2xl w-full sm:w-auto hover:bg-white transition-colors duration-300">
                Sign In to Portal
              </button>
            </motion.div>
          </motion.div>

          {/* 3D Animated Hero Dashboard Mockup */}
          <div className="mt-20 w-full max-w-5xl mx-auto z-20 relative" style={{ perspective: 1000 }}>
            <motion.div
              initial={{ rotateX: 30, rotateY: -10, opacity: 0, y: 100, scale: 0.9 }}
              animate={{ rotateX: [15, 5, 15], rotateY: [0, -2, 0], opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                opacity: { duration: 1 }, 
                y: { duration: 1, type: "spring", bounce: 0.4 },
                rotateX: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                rotateY: { duration: 8, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-full h-[300px] md:h-[500px] bg-white rounded-[2rem] shadow-2xl overflow-hidden relative border border-slate-200"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Glowing Accent */}
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
              
              {/* Dashboard UI Fake Container */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100">
                {/* Fake Window Header */}
                <div className="h-12 border-b border-slate-200 bg-slate-100 flex items-center px-6 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                
                {/* Fake Sidebar & Content Area */}
                <div className="flex h-[calc(100%-3rem)]">
                  <div className="w-48 border-r border-slate-200 p-4 hidden md:block">
                    <div className="h-4 w-24 bg-slate-200 rounded mb-6"></div>
                    <div className="space-y-4">
                      <div className="h-3 w-full bg-slate-200 rounded"></div>
                      <div className="h-3 w-3/4 bg-slate-200 rounded"></div>
                      <div className="h-3 w-5/6 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="flex-1 p-6 md:p-8">
                    <div className="flex gap-4 md:gap-6 mb-6">
                      <div className="flex-1 h-24 md:h-32 bg-slate-100 rounded-xl border border-slate-200"></div>
                      <div className="flex-1 h-24 md:h-32 bg-slate-100 rounded-xl border border-slate-200"></div>
                      <div className="flex-1 h-32 bg-slate-100 rounded-xl border border-slate-200 hidden md:block"></div>
                    </div>
                    <div className="w-full h-32 md:h-64 bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden">
                      {/* Fake Chart Lines */}
                      <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0 100 L0 50 Q 25 20, 50 60 T 100 30 L100 100 Z" fill="rgba(14, 165, 233, 0.1)" stroke="rgba(14, 165, 233, 0.5)" strokeWidth="1" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 mb-24">
            <FeatureCard 
              icon={<Shield className="text-primary" size={32} />}
              title="Enterprise Security"
              desc="Role-based access panels for Superadmin, Admin, Doctors, and Staff with complete data isolation."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Globe className="text-primary" size={32} />}
              title="Multi-Tenant Architecture"
              desc="Manage multiple hospital branches globally or operate your own distinct hospital universe securely."
              delay={0.2}
            />
            <FeatureCard 
              icon={<HeartPulse className="text-primary" size={32} />}
              title="Integrated Clinical Workflows"
              desc="From patient booking and pharmacy inventory to duty rosters, everything connects seamlessly."
              delay={0.3}
            />
          </div>

          {/* Pricing Section */}
          <div id="pricing-section" className="py-24 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 -z-10 rounded-3xl" />
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Simple, Transparent Pricing</h2>
              <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto">Start transforming your hospital operations today.</p>
            </motion.div>
            
            <div className="flex justify-center px-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -10 }}
                viewport={{ once: true }}
                className="bg-white p-8 md:p-10 max-w-md w-full border-2 border-primary relative overflow-hidden rounded-[2rem] shadow-2xl shadow-primary/20"
              >
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-4 py-2 rounded-bl-2xl uppercase tracking-widest">
                  Enterprise
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <img src="/zuna-logo.png" alt="ZUNA" className="w-8 h-8 object-contain" />
                  <span className="font-extrabold text-3xl tracking-tight text-slate-900">ZUNA HMS</span>
                </div>
                <p className="text-slate-500 font-medium">Full suite access for modern hospitals.</p>
                
                <div className="my-8 flex items-baseline gap-2">
                  <span className="text-6xl font-extrabold text-slate-900">₹0</span>
                  <span className="text-xl text-slate-500 font-bold">/month</span>
                </div>
                
                <ul className="space-y-5 mb-10 text-left">
                  <PricingFeature text="Full Access to all 49+ Modules" />
                  <PricingFeature text="Unlimited Staff & Doctor Accounts" />
                  <PricingFeature text="Pharmacy, Inventory & IPD" />
                  <PricingFeature text="Superadmin Verification Gateway" />
                  <PricingFeature text="Free 24/7 Priority Support" />
                </ul>
                
                <button onClick={handlePurchase} className="btn-primary w-full text-lg py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                  Register Your Hospital Now
                </button>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Patient Booking Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Patient Appointment Booking"
        >
          <div className="space-y-5 p-2">
            <p className="text-slate-500 font-medium leading-relaxed">Search for your registered hospital branch to book an instant appointment with a specialist.</p>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Hospital Code or Name</label>
              <input type="text" placeholder="e.g. Apollo Clinic" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Your Full Name</label>
              <input type="text" placeholder="John Doe" className="input-field" />
            </div>
            <button className="btn-primary w-full py-3 mt-4 text-lg" onClick={() => setIsModalOpen(false)}>Search Availability</button>
          </div>
        </Modal>
        
        {/* Footer */}
        <footer className="bg-white text-slate-600 py-16 px-6 relative z-10 border-t border-slate-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img src="/zuna-logo.png" alt="ZUNA" className="w-8 h-8 object-contain" />
                <span className="font-extrabold tracking-tight text-2xl text-slate-900">ZUNA</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-sm">
                The Enterprise OS for modern hospitals. Streamlining workflows, managing pharmacies, and securing patient data seamlessly.
              </p>
            </div>
            <div>
              <h4 className="text-slate-900 font-bold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><button className="hover:text-primary transition-colors">Features</button></li>
                <li><button onClick={scrollToPlans} className="hover:text-primary transition-colors">Pricing</button></li>
                <li><button className="hover:text-primary transition-colors">Security</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-bold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><button className="hover:text-primary transition-colors">About Us</button></li>
                <li><button className="hover:text-primary transition-colors">Careers</button></li>
                <li><button className="hover:text-primary transition-colors">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-bold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><button className="hover:text-primary transition-colors">Privacy Policy</button></li>
                <li><button className="hover:text-primary transition-colors">Terms of Service</button></li>
                <li><button className="hover:text-primary transition-colors">HIPAA Compliance</button></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-200 text-sm text-center text-slate-500">
            &copy; {new Date().getFullYear()} ZUNA Hospital Management System. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -8, scale: 1.02 }}
    className="bg-white p-8 md:p-10 text-left hover:border-primary/40 border border-slate-100 transition-all rounded-[2rem] shadow-glass hover:shadow-xl"
  >
    <div className="mb-6 bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm">
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">{title}</h3>
    <p className="text-slate-600 leading-relaxed font-medium text-lg">{desc}</p>
  </motion.div>
);

const PricingFeature = ({ text }) => (
  <li className="flex items-start gap-3 text-slate-700">
    <div className="bg-primary/10 rounded-full p-1 mt-0.5 shrink-0">
      <Check size={16} className="text-primary font-bold" />
    </div>
    <span className="font-semibold text-lg">{text}</span>
  </li>
);

export default LandingPage;
