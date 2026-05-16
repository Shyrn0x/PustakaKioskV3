/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { io } from 'socket.io-client';
import { 
  Library, 
  QrCode, 
  RotateCcw, 
  List, 
  User, 
  ArrowLeft,
  Search,
  BookOpen,
  Database,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from './lib/utils';

type ViewState = 'HOME' | 'PINJAM' | 'KEMBALI' | 'KATALOG' | 'STAFF_LOGIN' | 'DASHBOARD';

export default function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [remoteUrl, setRemoteUrl] = useState("");

  const handleLoginSuccess = (data: any) => {
    if (data.remoteUrl) setRemoteUrl(data.remoteUrl);
    setView('DASHBOARD');
  };

  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) setDbStatus('connected');
        else setDbStatus('checking'); // Less intrusive
      } catch (err) {
        setDbStatus('checking');
      }
    };
    checkDb();
  }, []);

  const renderView = () => {
    switch (view) {
      case 'HOME':
        return <HomeView onNavigate={setView} />;
      case 'PINJAM':
        return <ActionView title="Peminjaman Mandiri" onBack={() => setView('HOME')} type="PINJAM" />;
      case 'KEMBALI':
        return <ActionView title="Pengembalian Mandiri" onBack={() => setView('HOME')} type="KEMBALI" />;
      case 'KATALOG':
        return <KatalogView onBack={() => setView('HOME')} />;
      case 'STAFF_LOGIN':
        return <StaffLoginView onBack={() => setView('HOME')} onLogin={handleLoginSuccess} />;
      case 'DASHBOARD':
        return <StaffDashboard onLogout={() => setView('HOME')} remoteUrl={remoteUrl} />;
      default:
        return <HomeView onNavigate={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#6366f1] bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#d946ef] p-4 md:p-12 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-7xl bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col min-h-[85vh]">
        {/* Header */}
        <header className="px-10 py-6 border-b border-gray-100 flex items-center justify-between no-print">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setView('HOME')}
          >
            <div className="bg-[#6366f1] p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <Library size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tighter leading-none">PustakaKiosk</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sistem Perpustakaan Mandiri</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={cn(
              "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-colors",
              dbStatus === 'connected' ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
            )}>
              <div className={cn("w-2 h-2 rounded-full", dbStatus === 'connected' ? "bg-green-500 animate-pulse" : "bg-orange-500")} />
              {dbStatus === 'connected' ? "System Online" : "Local Database Only"}
            </div>
            
            <button 
              onClick={() => setView('STAFF_LOGIN')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl transition-all text-sm font-bold border border-gray-100"
            >
              <User size={18} />
              Portal Staff
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-0 overflow-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full p-8"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .min-h-screen { min-height: auto !important; height: auto !important; padding: 0 !important; background: none !important; }
          .shadow-2xl, .shadow-xl, .shadow-lg { shadow: none !important; }
          .bg-white { background: white !important; }
          .rounded-[40px] { border-radius: 0 !important; }
          
          /* Target specific QR container */
          .qr-print-only {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 4cm;
            height: 6cm;
            border: 1px solid #eee;
            padding: 10px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

function HomeView({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <HomeCard 
          icon={<QrCode size={40} />} 
          title="Pinjam Buku" 
          onClick={() => onNavigate('PINJAM')} 
          delay={0.1}
        />
        <HomeCard 
          icon={<RotateCcw size={40} />} 
          title="Kembalikan Buku" 
          onClick={() => onNavigate('KEMBALI')} 
          delay={0.2}
        />
        <HomeCard 
          icon={<List size={40} />} 
          title="Katalog Buku" 
          onClick={() => onNavigate('KATALOG')} 
          delay={0.3}
        />
      </div>
    </div>
  );
}

function HomeCard({ icon, title, onClick, delay }: { icon: React.ReactNode, title: string, onClick: () => void, delay: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="bg-white border-2 border-transparent hover:border-[#8b5cf6] p-10 rounded-[32px] shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-6 group"
    >
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-700 tracking-tight">{title}</h3>
    </motion.button>
  );
}

function ActionView({ title, onBack, type }: { title: string, onBack: () => void, type: 'PINJAM' | 'KEMBALI' }) {
  const [step, setStep] = useState(1);
  const [member, setMember] = useState<any>(null);
  const [book, setBook] = useState<any>(null);
  const [scannedInput, setScannedInput] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");

  const processQrCode = async (input: string) => {
    if (status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/books/${input}`);
      if (res.ok) {
        const bookData = await res.json();
        
        // Process Transaction
        const txRes = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: member.id,
            book_id: bookData.id,
            type: type
          })
        });

        if (txRes.ok) {
          setBook(bookData);
          setStatus('success');
          setMessage(type === 'PINJAM' ? "Peminjaman Berhasil!" : "Pengembalian Berhasil!");
          setTimeout(() => onBack(), 3000);
        } else {
          const err = await txRes.json();
          setStatus('error');
          setMessage(err.error || "Gagal memproses transaksi");
          setTimeout(() => setStatus('idle'), 3000);
        }
      } else {
        setStatus('error');
        setMessage("Buku tidak ditemukan!");
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err) {
      setStatus('error');
      setMessage("Terjadi kesalahan koneksi");
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const processRfid = async (input: string) => {
    if (status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/members/${input}`);
      if (res.ok) {
        const data = await res.json();
        setMember(data);
        setStep(2);
        setStatus('idle');
      } else {
        setStatus('error');
        setMessage("Kartu tidak terdaftar!");
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err) {
      setStatus('error');
      setMessage("Terjadi kesalahan koneksi");
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // RFID scanners usually act as keyboards. We listen for 'Enter' key.
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (status === 'loading') return;

      if (e.key === 'Enter') {
        const input = scannedInput.trim();
        if (!input) return;

        setScannedInput("");

        if (step === 1) {
          processRfid(input);
        } else {
          processQrCode(input);
        }
      } else if (e.key.length === 1) {
        setScannedInput(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scannedInput, step, member, type, status, onBack]);

  // Listen for WebSocket RFID scans
  useEffect(() => {
    const socket = io();
    socket.on('rfid_scanned', (uid: string) => {
      if (step === 1 && status === 'idle') {
        processRfid(uid);
      }
    });
    return () => { socket.disconnect(); };
  }, [step, status]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto gap-8 w-full">
        {status === 'success' ? (
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={64} />
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{message}</h3>
            <p className="text-gray-500 mt-2">Kembali ke menu utama dalam beberapa saat...</p>
          </motion.div>
        ) : (
          <>
            <div className="relative w-full flex flex-col items-center">
              {step === 1 || status !== 'idle' ? (
                <div className={cn(
                  "w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-300",
                  status === 'error' ? "border-red-500 bg-red-50" : 
                  status === 'loading' ? "border-blue-500 animate-spin border-t-transparent" : "border-dashed border-[#8b5cf6] animate-pulse"
                )}>
                  {status === 'loading' ? null : (
                    <div className={cn(
                      "w-40 h-40 rounded-full flex items-center justify-center",
                      status === 'error' ? "bg-red-100" : "bg-[#8b5cf6]/10"
                    )}>
                      {status === 'error' ? <XCircle size={64} className="text-red-500" /> : 
                       step === 1 ? <User size={64} className="text-[#8b5cf6]" /> : <BookOpen size={64} className="text-[#8b5cf6]" />}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-sm rounded-[2rem] overflow-hidden border-2 border-dashed border-indigo-200 aspect-square relative">
                  <Scanner 
                    onScan={(result) => {
                      if (result && result.length > 0 && status !== 'loading' && status !== 'success') {
                        processQrCode(result[0].rawValue);
                      }
                    }} 
                    formats={['qr_code']}
                    components={{
                       audio: false,
                       onOff: false,
                       torch: false,
                       finder: true,
                    }}
                    allowMultiple={true}
                    scanDelay={500}
                  />
                </div>
              )}
              
              {status === 'idle' && step === 1 && (
                <div className="absolute -bottom-2 right-1/2 translate-x-14 bg-[#8b5cf6] text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white z-10">
                  {step}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">
                {message || (step === 1 ? "Tempelkan Kartu RFID" : "Scan QR Code Buku")}
              </h3>
              <p className="text-gray-500 text-lg">
                {step === 1 
                  ? "Silakan letakkan kartu perpustakaan Anda pada sensor RFID untuk verifikasi." 
                  : `Halo, ${member?.name}. Arahkan QR Code buku ke arah kamera.`}
              </p>
            </div>

            {member && (
              <div className="bg-gray-50 p-4 rounded-2xl border flex items-center gap-4 text-left w-full max-w-sm">
                <div className="w-12 h-12 bg-[#8b5cf6] rounded-xl flex items-center justify-center text-white shrink-0">
                  <User size={24} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-gray-400 uppercase">Peminjam</p>
                  <p className="font-bold text-gray-800 truncate">{member.name}</p>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-300 pointer-events-none">
              {step === 1 ? "Menunggu input scanner RFID... (Keyboard Mode)" : "Kamera / Manual Scanner Aktif"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DashboardAction({ title, icon, color, onClick }: { title: string, icon: React.ReactNode, color: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-4 flex items-center gap-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all group border border-transparent hover:border-gray-200"
    >
      <div className={cn("w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-md", color)}>
        {icon}
      </div>
      <span className="font-bold text-gray-700 group-hover:text-gray-900 leading-tight text-left">{title}</span>
    </button>
  );
}

function KatalogView({ onBack }: { onBack: () => void }) {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/books?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        setBooks(Array.isArray(data) ? data : []);
      } catch (err) {
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Katalog Buku</h2>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari judul atau pengarang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-[#8b5cf6] outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#8b5cf6]/20 border-t-[#8b5cf6] rounded-full animate-spin" />
            <p className="text-gray-400">Memuat data buku...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">Buku tidak ditemukan.</div>
        ) : (
          books.map((book: any, i) => (
            <div key={i} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex gap-4">
              <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-[#8b5cf6]/40">
                <BookOpen size={32} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 leading-tight">{book.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{book.author} • {book.category}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    book.available_copies > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  )}>
                    {book.available_copies > 0 ? `${book.available_copies} Tersedia` : "Kosong"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StaffLoginView({ onBack, onLogin }: { onBack: () => void, onLogin: (data: any) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        onLogin(data);
      } else {
        setError("Username atau password salah!");
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-[#8b5cf6]/10 rounded-3xl text-[#8b5cf6] mb-4">
            <User size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Staff Portal</h2>
          <p className="text-gray-500">Masukkan kredensial Anda untuk masuk ke sistem</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
            <XCircle size={16} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-[#8b5cf6] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-[#8b5cf6] outline-none"
            />
          </div>
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-4 bg-[#6366f1] text-white rounded-xl font-bold shadow-lg hover:bg-[#5558e6] transition-all transform active:scale-95 mt-4 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <button 
            onClick={onBack}
            className="w-full py-2 text-gray-400 font-medium hover:text-gray-600 transition-colors"
          >
            Kembali ke Kiosk
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffDashboard({ onLogout, remoteUrl }: { onLogout: () => void, remoteUrl: string }) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOOKS' | 'MEMBERS' | 'REPORT'>('OVERVIEW');
  const [stats, setStats] = useState({ totalBooks: 0, borrowedBooks: 0, activeMembers: 0 });

  useEffect(() => {
    fetch('/api/stats').then(res => res.json()).then(setStats);
  }, [activeTab]);

  const menuItems = [
    { id: 'OVERVIEW', label: 'Ringkasan', icon: <Database size={20} /> },
    { id: 'BOOKS', label: 'Buku', icon: <BookOpen size={20} /> },
    { id: 'MEMBERS', label: 'Anggota', icon: <User size={20} /> },
    { id: 'REPORT', label: 'Log', icon: <List size={20} /> },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full -m-8 overflow-hidden bg-white">
      {/* Sidebar Dahsboard */}
      <aside className="w-full md:w-56 border-r border-gray-100 p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all text-sm",
                activeTab === item.id 
                  ? "bg-[#6366f1] text-white shadow-lg shadow-indigo-100" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-auto">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-sm"
          >
            <RotateCcw size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 p-8 flex flex-col overflow-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-2">
             <div className="text-right">
                <p className="text-xs font-black text-gray-800 leading-none uppercase">Admin</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Super User</p>
             </div>
             <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs border">A</div>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total Buku" value={stats.totalBooks} icon={<BookOpen size={20} />} color="text-indigo-600" />
                <StatCard label="Dipinjam" value={stats.borrowedBooks} icon={<RotateCcw size={20} />} color="text-amber-600" />
                <StatCard label="Anggota" value={stats.activeMembers} icon={<User size={20} />} color="text-emerald-600" />
              </div>

              <div className="flex-1">
                <RecentActivity />
              </div>
            </div>
          )}

          {activeTab === 'BOOKS' && <BookManagementView />}
          {activeTab === 'MEMBERS' && <MemberManagementView />}
          {activeTab === 'REPORT' && <ReportView />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className={cn("text-3xl font-black", color)}>{value}</p>
      </div>
      <div className={cn("p-4 rounded-2xl bg-gray-50", color.replace('text', 'text-opacity-20 bg'))}>
        {icon}
      </div>
    </div>
  );
}

import { QRCodeSVG } from 'qrcode.react';

function BookManagementView() {
  const [books, setBooks] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState<any>({ qr_code: '', title: '', author: '', publisher: '', isbn: '', category: '', total_copies: 1 });

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const loadBooks = () => fetch('/api/books', { cache: 'no-cache' }).then(res => res.json()).then(setBooks);
  useEffect(() => { loadBooks(); }, []);

  const executeDelete = async (id: number) => {
    const url = `/api/books/${id}`;
    try {
      const res = await fetch(url, { method: 'DELETE', cache: 'no-cache' });
      if (!res.ok) {
          const text = await res.text();
          alert(`Gagal menghapus: Server memberikan respon ${res.status} - ${text}`);
      } else {
          await loadBooks();
      }
    } catch (e) {
      alert('Delete request failed: ' + e);
    }
  };

  const downloadQR = (code: string, title: string) => {
    const svg = document.querySelector(`#qr-${code} svg`) as SVGElement;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 300, 300);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${title.replace(/[^a-z0-9]/gi, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const generateID = () => {
    let id: string = "";
    let isDuplicate = true;
    while(isDuplicate) {
        id = "BK-" + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 4).toUpperCase();
        isDuplicate = books.some(b => b.qr_code === id);
    }
    setFormData(prev => ({ ...prev, qr_code: id }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const isEdit = !!formData.id;
    const res = await fetch(isEdit ? `/api/books/${formData.id}` : '/api/books', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      loadBooks();
      setShowAdd(false);
      setFormData({ qr_code: '', title: '', author: '', publisher: '', isbn: '', category: '', total_copies: 1 });
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteTarget(id);
  };

  const handleEdit = (book: any) => {
    setFormData({
      id: book.id,
      qr_code: book.qr_code || '',
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      isbn: book.isbn || '',
      category: book.category || '',
      total_copies: book.total_copies || 1
    });
    setShowAdd(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Manajemen Buku</h3>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-[#6366f1] text-white rounded-xl font-bold hover:bg-[#5558e6] text-sm"
        >
          {showAdd ? 'Batal' : '+ Tambah Buku'}
        </button>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">Apakah Anda yakin ingin menghapus buku ini?</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl">Batal</button>
              <button onClick={() => { executeDelete(deleteTarget); setDeleteTarget(null); }} className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 animate-in fade-in duration-300">
           <div className="md:col-span-2 bg-gray-50 p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-100 h-fit">
            <div className="md:col-span-2 flex items-end gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">QR Code ID</label>
                <input required type="text" placeholder="ID Buku" value={formData.qr_code} onChange={e => setFormData({...formData, qr_code: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
              </div>
              <button type="button" onClick={generateID} className="px-4 py-2 bg-indigo-100 text-indigo-600 font-bold rounded-xl text-xs h-[42px] hover:bg-indigo-200">Auto</button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Judul</label>
              <input required type="text" placeholder="Judul Buku" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Pengarang</label>
              <input required type="text" placeholder="Pengarang" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Penerbit</label>
              <input required type="text" placeholder="Penerbit" value={formData.publisher} onChange={e => setFormData({...formData, publisher: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">ISBN</label>
              <input required type="text" placeholder="ISBN" value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Kategori</label>
              <input required type="text" placeholder="Kategori" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Jumlah</label>
              <input required type="number" placeholder="Stok" value={formData.total_copies} onChange={e => setFormData({...formData, total_copies: parseInt(e.target.value)})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            <button type="submit" className="md:col-span-2 py-3 bg-[#6366f1] text-white font-bold rounded-xl mt-2">Simpan</button>
          </div>
          {formData.qr_code && (
            <div className="bg-white p-8 rounded-[2rem] border shadow-sm flex flex-col items-center justify-center gap-4 h-fit">
               <div id={`qr-${formData.qr_code}`} className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <QRCodeSVG value={formData.qr_code} size={150} />
               </div>
               <button 
                  type="button"
                  onClick={() => downloadQR(formData.qr_code, formData.title || "NewBook")}
                  className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm"
               >
                  Download Gambar
               </button>
            </div>
          )}
        </form>
      )}

      {!showAdd && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase border-b">
              <tr>
                <th className="px-6 py-4">QR</th>
                <th className="px-6 py-4">Buku</th>
                <th className="px-6 py-4">Tersedia</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {books.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div id={`qr-${b.qr_code}`} className="hidden"><QRCodeSVG value={b.qr_code} size={256} /></div>
                    <span className="font-mono text-[10px] font-bold text-gray-400">{b.qr_code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{b.title}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-600">{b.available_copies}/{b.total_copies}</td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(b)}
                      className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit Buku"
                    >
                      <Database size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(b.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Hapus Buku"
                    >
                      <XCircle size={18} />
                    </button>
                    <button 
                      onClick={() => downloadQR(b.qr_code, b.title)}
                      className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Unduh QR"
                    >
                      <QrCode size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MemberManagementView() {
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [members, setMembers] = useState([]);
  const [regStep, setRegStep] = useState<'IDLE' | 'SCANNING' | 'FORM'>('IDLE');
  const [formData, setFormData] = useState<any>({ rfid_uid: '', name: '', student_id: '', role: 'SISWA' });
  const [scannedInput, setScannedInput] = useState("");

  const loadMembers = () => fetch('/api/members', { cache: 'no-cache' }).then(res => res.json()).then(setMembers);
  useEffect(() => { loadMembers(); }, []);

  const executeDelete = async (id: number) => {
    const url = `/api/members/${id}`;
    try {
      const res = await fetch(url, { method: 'DELETE', cache: 'no-cache' });
      if (!res.ok) {
          const text = await res.text();
          alert(`Gagal menghapus: Server memberikan respon ${res.status} - ${text}`);
      } else {
          await loadMembers();
      }
    } catch (e) {
      alert('Delete request failed: ' + e);
    }
  };

  // Keyboard handle for RFID Scan during registration
  useEffect(() => {
    if (regStep !== 'SCANNING') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && scannedInput.trim()) {
        setFormData(prev => ({ ...prev, rfid_uid: scannedInput.trim() }));
        setScannedInput("");
        setRegStep('FORM');
      } else if (e.key.length === 1) {
        setScannedInput(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [regStep, scannedInput]);

  // WebSocket handle for RFID Scan during registration
  useEffect(() => {
    const socket = io();
    socket.on('rfid_scanned', (uid: string) => {
      if (regStep === 'SCANNING') {
        setFormData(prev => ({ ...prev, rfid_uid: uid.trim() }));
        setRegStep('FORM');
      }
    });
    return () => { socket.disconnect(); };
  }, [regStep]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const isEdit = !!formData.id;
    const res = await fetch(isEdit ? `/api/members/${formData.id}` : '/api/members', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setRegStep('IDLE');
      loadMembers();
      setFormData({ rfid_uid: '', name: '', student_id: '', role: 'SISWA' });
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteTarget(id);
  };

  const handleEdit = (member: any) => {
    setFormData({
      id: member.id,
      rfid_uid: member.rfid_uid || '',
      name: member.name || '',
      student_id: member.student_id || '',
      role: member.role || 'SISWA'
    });
    setRegStep('FORM');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Data Anggota</h3>
        <button 
          onClick={() => {
            if (regStep === 'IDLE') {
              setFormData({ rfid_uid: '', name: '', student_id: '', role: 'SISWA' });
              setRegStep('SCANNING');
            } else setRegStep('IDLE');
          }}
          className="px-4 py-2 bg-[#6366f1] text-white rounded-xl font-bold hover:bg-[#5558e6]"
        >
          {regStep === 'IDLE' ? '+ Daftar Anggota' : 'Batal'}
        </button>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">Apakah Anda yakin ingin menghapus anggota ini?</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl">Batal</button>
              <button onClick={() => { executeDelete(deleteTarget); setDeleteTarget(null); }} className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {regStep === 'SCANNING' && (
        <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 p-12 rounded-[2rem] text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
            <User size={40} />
          </div>
          <h4 className="text-2xl font-black text-indigo-900 mb-2">Menunggu Scan Kartu...</h4>
          <p className="text-indigo-400 max-w-sm mx-auto">Silakan tempelkan kartu RFID baru untuk memulai proses pendaftaran anggota.</p>
          <div className="mt-8 flex items-center justify-center gap-2">
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-100" />
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-200" />
          </div>
        </div>
      )}

      {regStep === 'FORM' && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border-2 border-indigo-100 shadow-xl shadow-indigo-100/20 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="md:col-span-2 flex items-center gap-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-2">
            <div className="w-12 h-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase">RFID UID Berhasil Diverifikasi</p>
              <p className="font-mono text-indigo-900 font-bold">{formData.rfid_uid}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-black text-gray-400 mb-2 uppercase">Nama Lengkap</label>
            <input required type="text" placeholder="Masukkan nama siswa" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 mb-2 uppercase">Nomor Induk (ID)</label>
            <input required type="text" placeholder="Contoh: 3.33.xx.x" value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} className="w-full px-5 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 mb-2 uppercase">Peran Anggota</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-5 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 font-bold">
              <option value="SISWA">Siswa</option>
              <option value="GURU">Guru / Staff</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full py-4 bg-[#6366f1] text-white font-black rounded-2xl shadow-lg hover:shadow-indigo-200 transition-all active:scale-[0.98]">
              Daftarkan Sekarang
            </button>
          </div>
        </form>
      )}

      {regStep === 'IDLE' && (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-x-auto shadow-sm">
          <table className="w-full min-w-[600px] text-left">
          <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
            <tr>
              <th className="px-6 py-4 tracking-tighter">RFID UID</th>
              <th className="px-6 py-4">Nama Lengkap</th>
              <th className="px-6 py-4">NISN</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {members.map((m: any) => (
              <tr key={m.id} className="hover:bg-gray-50/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded">{m.rfid_uid}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-black text-gray-800">{m.name}</p>
                </td>
                <td className="px-6 py-4 font-bold text-gray-500 tracking-tight">{m.student_id}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    m.role === 'GURU' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                  )}>{m.role}</span>
                </td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(m)}
                      className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit Anggota"
                    >
                      <Database size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(m.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Hapus Anggota"
                    >
                      <XCircle size={18} />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    </div>
  );
}

function ReportView() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/transactions').then(res => res.json()).then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Riwayat Transaksi</h3>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase border-b">
            <tr>
              <th className="px-6 py-4">Waktu</th>
              <th className="px-6 py-4">Anggota</th>
              <th className="px-6 py-4">Buku</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-gray-400 text-[10px] font-bold">
                  {new Date(t.transaction_date).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 font-bold text-gray-700">{t.member_name}</td>
                <td className="px-6 py-4 text-gray-500">{t.book_title}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                    t.type === 'PINJAM' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                  )}>{t.type}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <div className="p-12 text-center text-gray-300">Belum ada transaksi.</div>}
      </div>
    </div>
  );
}

function RecentActivity() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch('/api/transactions').then(res => res.json()).then(data => setLogs(data.slice(0, 5)));
  }, []);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Aktivitas Terakhir</h3>
      <div className="flex-1 space-y-4">
        {logs.map((l: any) => (
          <div key={l.id} className="flex items-center gap-4 py-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              l.type === 'PINJAM' ? "bg-amber-400" : "bg-emerald-400"
            )} />
            <div className="flex-1">
              <p className="text-sm text-gray-600 leading-tight">
                <span className="font-bold text-gray-800">{l.member_name}</span> 
                {l.type === 'PINJAM' ? ' meminjam ' : ' mengembalikan '} 
                <span className="text-indigo-600 font-medium">{l.book_title}</span>
              </p>
              <p className="text-[10px] text-gray-300 font-bold uppercase mt-1">{new Date(l.transaction_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="text-center py-8 text-gray-300 text-sm">Tidak ada aktivitas.</p>}
      </div>
    </div>
  );
}
