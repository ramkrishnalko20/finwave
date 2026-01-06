import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Compass, 
  Calculator, 
  User as UserIcon, 
  Bell, 
  X,
  Settings,
  HelpCircle,
  Shield,
  CreditCard,
  LogOut,
  ChevronRight,
  Layers,
  Loader2,
  Sparkles
} from 'lucide-react';

import Home from './pages/Home';
import Calculators from './pages/Calculators';
import Explore from './pages/Explore';
import Assets from './pages/Assets';
import PortfolioDetails from './pages/PortfolioDetails';
import Account from './pages/Account';
import Login from './pages/Login';
import Profile from './pages/Profile';
import KYC from './pages/KYC';
import { BrandLogo } from './components/BrandLogo';
import { usePortfolio } from './PortfolioContext';
import { auth } from './firebase';

interface UIContextType {
  isMenuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  isNotifOpen: boolean;
  setNotifOpen: (v: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within UIProvider");
  return context;
};

const App: React.FC = () => {
  const { firebaseUser, loading } = usePortfolio();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    setMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initializing Secure Workspace...</p>
      </div>
    );
  }

  return (
    <UIContext.Provider value={{ isMenuOpen, setMenuOpen, isNotifOpen, setNotifOpen }}>
      <Router>
        <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
          {firebaseUser ? (
            <>
              <Sidebar isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} />
              
              <main className="flex-1 overflow-y-auto no-scrollbar pb-24" onClick={() => setNotifOpen(false)}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/assets" element={<Assets />} /> 
                  <Route path="/calculators" element={<Calculators />} />
                  <Route path="/account" element={<Account onLogout={handleLogout} />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/kyc" element={<KYC />} />
                  <Route path="/folio/:id" element={<PortfolioDetails />} />
                  <Route path="/scheme/:code" element={<PortfolioDetails />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Navigation />
            </>
          ) : (
            <Routes>
              <Route path="/login" element={<Login onLogin={() => {}} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          )}
        </div>
      </Router>
    </UIContext.Provider>
  );
};

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void; onLogout: () => void }> = ({ isOpen, onClose, onLogout }) => {
  const { user } = usePortfolio();
  return (
    <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`absolute left-0 top-0 bottom-0 w-4/5 bg-white shadow-2xl transform transition-transform duration-300 ease-out p-6 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <BrandLogo size={32} />
            <span className="font-black text-slate-800 tracking-tight text-lg">Finwave</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400"><X size={20} /></button>
        </div>

        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-8">
          <img src={user.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
          <div>
            <p className="font-bold text-slate-800 text-sm">{user.name}</p>
            <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {[
            { icon: UserIcon, label: 'Profile', path: '/profile' },
            { icon: Calculator, label: 'Financial Tools', path: '/calculators' },
            { icon: CreditCard, label: 'Bank Accounts', path: '/account' },
            { icon: Shield, label: 'Security', path: '/account' },
            { icon: Settings, label: 'Settings', path: '/account' },
            { icon: HelpCircle, label: 'Help Center', path: '/account' },
          ].map((item, idx) => (
            <Link key={idx} to={item.path} onClick={onClose} className="flex items-center gap-4 p-4 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 font-semibold transition-colors">
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <button onClick={onLogout} className="mt-auto flex items-center gap-4 p-4 rounded-xl text-red-500 hover:bg-red-50 font-bold transition-colors">
          <LogOut size={20} />
          <span className="text-sm">Log Out</span>
        </button>
      </div>
    </div>
  );
};

const Navigation: React.FC = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Home', icon: LayoutGrid },
    { path: '/explore', label: 'Explore', icon: Compass },
    { path: '/calculators', label: 'Tools', icon: Calculator },
    { path: '/assets', label: 'Assets', icon: Layers },
    { path: '/account', label: 'Account', icon: UserIcon },
  ];
  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 flex justify-around items-center py-3 px-1 z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#0059B2] scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default App;