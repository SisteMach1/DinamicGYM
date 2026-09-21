import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Plus, Edit2, Trash2, RefreshCw, Ticket,
  MessageCircle, Settings, Download, Upload, FileSpreadsheet,
  Users, CheckCircle2, AlertTriangle, Clock3, X, Calendar,
  DollarSign, KeyRound, Smartphone, LogOut
} from 'lucide-react';

type Cliente = {
  id: string;
  nombre: string;
  whatsapp: string;
  fechaAbono: string;
  fechaVenc: string;
  monto: number;
  nota: string;
  creado: string;
};

const STORAGE_KEY = 'dinamic_gym_v1';
const AUTH_KEY = 'dinamic_gym_auth_v1';
const DEFAULT_PASS = 'dinamic2026';

const todayISO = () => new Date().toISOString().split('T')[0];
const addDays = (iso: string, days: number) => {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
const formatAR = (iso: string) => {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const diffDays = (iso: string) => {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const target = new Date(iso + 'T12:00:00');
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
};
const statusOf = (fv: string): 'VENCIDO' | 'POR VENCER' | 'VIGENTE' => {
  const d = diffDays(fv);
  if (d < 0) return 'VENCIDO';
  if (d <= 3) return 'POR VENCER';
  return 'VIGENTE';
};
const hashSimple = (s: string) => {
  try { return btoa(unescape(encodeURIComponent(s))).split('').reverse().join('') + '_dg'; }
  catch { return s.split('').reverse().join('') + '_dg'; }
};

const seedClientes: Cliente[] = [
  { id: '1', nombre: 'Marcos Ríos', whatsapp: '+5491134567890', fechaAbono: todayISO(), fechaVenc: addDays(todayISO(), 12), monto: 25000, nota: 'Musculación - Lunes a Viernes', creado: new Date().toISOString() },
  { id: '2', nombre: 'Luciana Torres', whatsapp: '+5491145678901', fechaAbono: addDays(todayISO(), -28), fechaVenc: addDays(todayISO(), 2), monto: 25000, nota: 'Cross + Funcional', creado: new Date().toISOString() },
  { id: '3', nombre: 'Julián Ferreyra', whatsapp: '+5491156789012', fechaAbono: addDays(todayISO(), -35), fechaVenc: addDays(todayISO(), -5), monto: 22000, nota: 'Pase libre - Tarde', creado: new Date().toISOString() },
  { id: '4', nombre: 'Agustina Mendez', whatsapp: '+5491167890123', fechaAbono: addDays(todayISO(), -10), fechaVenc: addDays(todayISO(), 20), monto: 25000, nota: 'Spinning + Musculación', creado: new Date().toISOString() },
];

export default function App() {
  // AUTH
  const [isAuth, setIsAuth] = useState(false);
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [storedHash, setStoredHash] = useState<string>(hashSimple(DEFAULT_PASS));

  // CLIENTS
  const [clientes, setClientes] = useState<Cliente[]>(seedClientes);
  const [q, setQ] = useState('');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'VIGENTE' | 'POR VENCER' | 'VENCIDO'>('TODOS');

  // MODALS
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<Omit<Cliente, 'id' | 'creado'>>({ nombre: '', whatsapp: '', fechaAbono: todayISO(), fechaVenc: addDays(todayISO(), 30), monto: 25000, nota: '' });
  const [showTicket, setShowTicket] = useState<Cliente | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPassChange, setShowPassChange] = useState(false);
  const [passOld, setPassOld] = useState('');
  const [passNew, setPassNew] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // INIT
  useEffect(() => {
    try {
      const a = localStorage.getItem(AUTH_KEY);
      if (a) {
        const parsed = JSON.parse(a);
        if (parsed?.hash) setStoredHash(parsed.hash);
        if (parsed?.isAuth) setIsAuth(true);
      }
      const c = localStorage.getItem(STORAGE_KEY);
      if (c) {
        const parsed = JSON.parse(c);
        if (Array.isArray(parsed) && parsed.length) setClientes(parsed);
      }
    } catch {}
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes)); } catch {}
  }, [clientes]);

  const metrics = useMemo(() => {
    const total = clientes.length;
    const alDia = clientes.filter(c => statusOf(c.fechaVenc) === 'VIGENTE').length;
    const vencidos = clientes.filter(c => statusOf(c.fechaVenc) === 'VENCIDO').length;
    const now = new Date();
    const mes = now.getMonth(); const year = now.getFullYear();
    const ingresos = clientes.filter(c => {
      const d = new Date(c.fechaAbono + 'T12:00:00');
      return d.getMonth() === mes && d.getFullYear() === year;
    }).reduce((acc, c) => acc + (c.monto || 0), 0);
    return { total, alDia, vencidos, ingresos };
  }, [clientes]);

  const filtered = useMemo(() => {
    return clientes.filter(c => {
      const matchesQ = q === '' || c.nombre.toLowerCase().includes(q.toLowerCase()) || c.whatsapp.includes(q) || c.nota.toLowerCase().includes(q.toLowerCase());
      const st = statusOf(c.fechaVenc);
      const matchesStatus = filterStatus === 'TODOS' || st === filterStatus;
      return matchesQ && matchesStatus;
    }).sort((a, b) => diffDays(a.fechaVenc) - diffDays(b.fechaVenc));
  }, [clientes, q, filterStatus]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr('');
    if (loginUser.trim().toLowerCase() !== 'admin') { setLoginErr('Usuario incorrecto'); return; }
    if (hashSimple(loginPass) !== storedHash) { setLoginErr('Contraseña incorrecta'); return; }
    setIsAuth(true);
    try { localStorage.setItem(AUTH_KEY, JSON.stringify({ hash: storedHash, isAuth: true })); } catch {}
  };

  const handleLogout = () => {
    setIsAuth(false);
    try { localStorage.setItem(AUTH_KEY, JSON.stringify({ hash: storedHash, isAuth: false })); } catch {}
    setLoginPass('');
  };

  const openNew = () => {
    setEditing(null);
    setFormData({ nombre: '', whatsapp: '', fechaAbono: todayISO(), fechaVenc: addDays(todayISO(), 30), monto: 25000, nota: '' });
    setShowForm(true);
  };
  const openEdit = (c: Cliente) => {
    setEditing(c);
    setFormData({ nombre: c.nombre, whatsapp: c.whatsapp, fechaAbono: c.fechaAbono, fechaVenc: c.fechaVenc, monto: c.monto, nota: c.nota });
    setShowForm(true);
  };
  const saveClient = () => {
    if (!formData.nombre.trim()) return;
    if (editing) {
      setClientes(prev => prev.map(x => x.id === editing.id ? { ...x, ...formData } : x));
    } else {
      const nuevo: Cliente = { id: Date.now().toString(), creado: new Date().toISOString(), ...formData };
      setClientes(prev => [nuevo, ...prev]);
    }
    setShowForm(false);
  };
  const deleteClient = (id: string) => {
    if (!confirm('¿Eliminar cliente?')) return;
    setClientes(prev => prev.filter(c => c.id !== id));
  };
  const renewClient = (c: Cliente) => {
    const nuevoVenc = addDays(todayISO(), 30);
    setClientes(prev => prev.map(x => x.id === c.id ? { ...x, fechaAbono: todayISO(), fechaVenc: nuevoVenc } : x));
  };
  const whatsappLink = (c: Cliente) => {
    const num = c.whatsapp.replace(/[^0-9]/g, '');
    const st = statusOf(c.fechaVenc);
    let msg = `Hola ${c.nombre}! Soy de DINAMIC GYM. `;
    if (st === 'VENCIDO') msg += `Tu abono venció el ${formatAR(c.fechaVenc)}. ¿Querés renovar?`;
    else if (st === 'POR VENCER') msg += `Tu abono vence el ${formatAR(c.fechaVenc)} (en ${diffDays(c.fechaVenc)} días). Te esperamos para renovar.`;
    else msg += `Tu abono está al día hasta el ${formatAR(c.fechaVenc)}. ¡Seguí así!`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  };

  const exportExcel = () => {
    const headers = ['Nombre', 'WhatsApp', 'Abono', 'Vencimiento', 'Estado', 'Monto', 'Nota'];
    const rows = clientes.map(c => [c.nombre, c.whatsapp, formatAR(c.fechaAbono), formatAR(c.fechaVenc), statusOf(c.fechaVenc), c.monto.toString(), `"${c.nota.replace(/"/g, '""')}"`]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `dinamic_gym_${todayISO()}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(clientes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `backup_${STORAGE_KEY}_${todayISO()}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (Array.isArray(parsed)) { setClientes(parsed); alert('Respaldo importado'); }
      } catch { alert('Archivo inválido'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') setDeferredPrompt(null);
    } else {
      alert('Para instalar: en Chrome móvil usa el menú ⋮ > Instalar app / Agregar a pantalla de inicio');
    }
  };
  const handleChangePass = () => {
    setPassMsg('');
    if (hashSimple(passOld) !== storedHash) { setPassMsg('Contraseña actual incorrecta'); return; }
    if (passNew.length < 6) { setPassMsg('La nueva debe tener al menos 6 caracteres'); return; }
    const newHash = hashSimple(passNew);
    setStoredHash(newHash);
    try { localStorage.setItem(AUTH_KEY, JSON.stringify({ hash: newHash, isAuth: true })); } catch {}
    setPassMsg('¡Contraseña actualizada!');
    setPassOld(''); setPassNew('');
    setTimeout(() => { setShowPassChange(false); setPassMsg(''); }, 1200);
  };

  // LOGIN SCREEN - RED/BLACK PREMIUM CLEAN
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center relative overflow-hidden selection:bg-[#FF1A1A]/30">
        {/* subtle red gradients */}
        <div className="pointer-events-none absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full blur-[120px] opacity-[0.18]" style={{ background: 'radial-gradient(circle, #FF1A1A 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-[0.12]" style={{ background: 'radial-gradient(circle, #E10600 0%, transparent 70%)' }} />
        <div className="w-full max-w-[420px] mx-4 relative z-10">
          <div className="bg-[#141414]/90 backdrop-blur-xl border border-[#FF1A1A]/20 rounded-[24px] p-8 md:p-10 shadow-[0_0_80px_rgba(255,26,26,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-[32px] font-black tracking-[-0.04em] leading-none">DINAMIC</span>
                <span className="text-[32px] font-black tracking-[-0.04em] leading-none text-[#FF1A1A]">GYM</span>
              </div>
              <div className="mt-3 h-[2px] w-[56px] bg-gradient-to-r from-[#FF1A1A] to-transparent rounded-full" />
              <p className="mt-4 text-[13px] tracking-[0.18em] text-white/40 font-semibold">GESTIÓN PREMIUM</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-3">
                <label className="text-[11px] tracking-[0.14em] font-bold text-white/50">USUARIO</label>
                <input value={loginUser} onChange={e => setLoginUser(e.target.value)} className="w-full h-[48px] bg-[#0F0F0F] border border-white/[0.08] rounded-[12px] px-4 text-[15px] font-medium outline-none focus:border-[#FF1A1A]/50 focus:shadow-[0_0_0_3px_rgba(255,26,26,0.15)] transition-all placeholder:text-white/20" placeholder="admin" />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] tracking-[0.14em] font-bold text-white/50">CONTRASEÑA</label>
                <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full h-[48px] bg-[#0F0F0F] border border-white/[0.08] rounded-[12px] px-4 text-[15px] font-medium outline-none focus:border-[#FF1A1A]/50 focus:shadow-[0_0_0_3px_rgba(255,26,26,0.15)] transition-all placeholder:text-white/20" placeholder="••••••••" />
              </div>
              {loginErr && <div className="text-[13px] font-medium text-[#FF4D4D] bg-[#FF1A1A]/10 border border-[#FF1A1A]/20 rounded-[10px] px-3 py-2">{loginErr}</div>}
              <button type="submit" className="w-full h-[50px] rounded-[12px] bg-[#FF1A1A] hover:bg-[#E10600] text-white font-black tracking-[0.06em] text-[14px] shadow-[0_0_30px_rgba(255,26,26,0.45)] hover:shadow-[0_0_50px_rgba(255,26,26,0.65)] hover:scale-[1.01] active:scale-[0.99] transition-all">INGRESAR</button>
            </form>
            <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-white/25 tracking-[0.12em] font-medium">
              <span className="w-1 h-1 rounded-full bg-white/20" /> ACCESO PRIVADO
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="min-h-screen bg-[#080808] text-white relative overflow-hidden selection:bg-[#FF1A1A]/30">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&display=swap'); *{font-family:Inter,system-ui,sans-serif}`}</style>
      {/* bg glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-[30%] left-[10%] w-[60%] h-[60%] rounded-full blur-[140px] opacity-[0.10]" style={{ background: 'radial-gradient(circle, #FF1A1A 0%, transparent 70%)' }} />
        <div className="absolute top-[20%] right-[-15%] w-[50%] h-[50%] rounded-full blur-[140px] opacity-[0.07]" style={{ background: 'radial-gradient(circle, #E10600 0%, transparent 70%)' }} />
      </div>

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#080808]/80 border-b border-white/[0.06]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-baseline gap-[3px]">
              <span className="text-[20px] md:text-[22px] font-black tracking-[-0.03em]">DINAMIC</span>
              <span className="text-[20px] md:text-[22px] font-black tracking-[-0.03em] text-[#FF1A1A]">GYM</span>
            </div>
            <div className="hidden md:flex items-center gap-2 pl-5 border-l border-white/10">
              <span className="w-[6px] h-[6px] rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
              <span className="text-[11px] tracking-[0.14em] font-bold text-white/40">EN LÍNEA</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="md:hidden flex items-center gap-2 mr-1">
              <span className="w-[5px] h-[5px] rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
              <span className="text-[10px] tracking-[0.12em] font-bold text-white/40">EN LÍNEA</span>
            </div>
            <button onClick={() => setShowSettings(true)} className="w-[40px] h-[40px] rounded-[12px] bg-[#141414] border border-white/[0.08] hover:border-[#FF1A1A]/30 hover:bg-[#1A1A1A] flex items-center justify-center transition-all hover:scale-[1.04] group">
              <Settings className="w-[18px] h-[18px] text-white/60 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 md:py-8 relative z-10">
        {/* metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="group bg-[#141414]/80 backdrop-blur-xl border border-white/[0.06] hover:border-[#FF1A1A]/30 rounded-[18px] p-4 md:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(255,26,26,0.18)] transition-all hover:scale-[1.015]">
            <div className="flex items-start justify-between">
              <div className="w-[36px] h-[36px] rounded-[10px] bg-[#FF1A1A]/12 border border-[#FF1A1A]/20 flex items-center justify-center"><Users className="w-[18px] h-[18px] text-[#FF1A1A]" /></div>
              <span className="text-[10px] tracking-[0.14em] font-bold text-white/30">TOTAL</span>
            </div>
            <div className="mt-4 text-[28px] md:text-[32px] font-black tracking-[-0.03em] leading-none">{metrics.total}</div>
            <div className="mt-1 text-[12px] text-white/40 font-medium">Clientes registrados</div>
          </div>
          <div className="group bg-[#141414]/80 backdrop-blur-xl border border-white/[0.06] hover:border-[#10B981]/30 rounded-[18px] p-4 md:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] transition-all hover:scale-[1.015]">
            <div className="flex items-start justify-between">
              <div className="w-[36px] h-[36px] rounded-[10px] bg-[#10B981]/12 border border-[#10B981]/20 flex items-center justify-center"><CheckCircle2 className="w-[18px] h-[18px] text-[#10B981]" /></div>
              <span className="text-[10px] tracking-[0.14em] font-bold text-white/30">AL DÍA</span>
            </div>
            <div className="mt-4 text-[28px] md:text-[32px] font-black tracking-[-0.03em] leading-none">{metrics.alDia}</div>
            <div className="mt-1 text-[12px] text-white/40 font-medium">Cuotas vigentes</div>
          </div>
          <div className="group bg-[#141414]/80 backdrop-blur-xl border border-white/[0.06] hover:border-[#FF1A1A]/30 rounded-[18px] p-4 md:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(255,26,26,0.18)] transition-all hover:scale-[1.015]">
            <div className="flex items-start justify-between">
              <div className="w-[36px] h-[36px] rounded-[10px] bg-[#FF1A1A]/12 border border-[#FF1A1A]/20 flex items-center justify-center"><AlertTriangle className="w-[18px] h-[18px] text-[#FF1A1A]" /></div>
              <span className="text-[10px] tracking-[0.14em] font-bold text-white/30">VENCIDOS</span>
            </div>
            <div className="mt-4 text-[28px] md:text-[32px] font-black tracking-[-0.03em] leading-none">{metrics.vencidos}</div>
            <div className="mt-1 text-[12px] text-white/40 font-medium">Requieren acción</div>
          </div>
          <div className="group bg-[#141414]/80 backdrop-blur-xl border border-white/[0.06] hover:border-[#FF1A1A]/25 rounded-[18px] p-4 md:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(255,26,26,0.18)] transition-all hover:scale-[1.015]">
            <div className="flex items-start justify-between">
              <div className="w-[36px] h-[36px] rounded-[10px] bg-white/[0.06] border border-white/10 flex items-center justify-center"><DollarSign className="w-[18px] h-[18px] text-white/70" /></div>
              <span className="text-[10px] tracking-[0.14em] font-bold text-white/30">MES</span>
            </div>
            <div className="mt-4 text-[22px] md:text-[26px] font-black tracking-[-0.03em] leading-none">${metrics.ingresos.toLocaleString('es-AR')}</div>
            <div className="mt-1 text-[12px] text-white/40 font-medium">Ingresos del mes</div>
          </div>
        </div>

        {/* toolbar */}
        <div className="mt-6 bg-[#141414]/70 backdrop-blur-xl border border-white/[0.06] rounded-[18px] p-3 md:p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex-1 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-white/30" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cliente, WhatsApp, nota..." className="w-full h-[42px] bg-[#0F0F0F] border border-white/[0.07] rounded-[12px] pl-10 pr-4 text-[14px] outline-none focus:border-[#FF1A1A]/40 focus:shadow-[0_0_0_3px_rgba(255,26,26,0.12)] placeholder:text-white/25 transition-all" />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {(['TODOS','VIGENTE','POR VENCER','VENCIDO'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`h-[42px] px-4 rounded-[12px] text-[12px] font-bold tracking-[0.06em] whitespace-nowrap border transition-all ${filterStatus===s ? 'bg-[#FF1A1A] border-[#FF1A1A] text-white shadow-[0_0_20px_rgba(255,26,26,0.4)]' : 'bg-[#0F0F0F] border-white/[0.07] text-white/50 hover:text-white hover:border-white/15'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportExcel} className="h-[42px] px-4 rounded-[12px] bg-[#0F0F0F] border border-white/[0.08] hover:border-white/15 text-white/70 hover:text-white text-[13px] font-bold flex items-center gap-2 transition-all hover:scale-[1.02]">
              <FileSpreadsheet className="w-[16px] h-[16px]" /> Excel
            </button>
            <button onClick={openNew} className="h-[42px] px-5 rounded-[12px] bg-[#FF1A1A] hover:bg-[#E10600] text-white font-black text-[13px] tracking-[0.04em] shadow-[0_0_24px_rgba(255,26,26,0.4)] hover:shadow-[0_0_36px_rgba(255,26,26,0.6)] flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="w-[16px] h-[16px]" /> NUEVO CLIENTE
            </button>
          </div>
        </div>

        {/* grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => {
            const st = statusOf(c.fechaVenc);
            const dd = diffDays(c.fechaVenc);
            return (
              <div key={c.id} className="group bg-[#141414]/80 backdrop-blur-xl border border-white/[0.06] hover:border-[#FF1A1A]/25 rounded-[20px] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(255,26,26,0.14)] transition-all hover:scale-[1.01] hover:-translate-y-[1px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[16px] font-extrabold tracking-[-0.02em] leading-tight truncate">{c.nombre}</div>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-white/40"><Smartphone className="w-[12px] h-[12px]" /> {c.whatsapp}</div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black tracking-[0.08em] border ${st==='VIGENTE' ? 'bg-[#10B981]/12 text-[#10B981] border-[#10B981]/20' : st==='POR VENCER' ? 'bg-[#F59E0B]/12 text-[#F59E0B] border-[#F59E0B]/20' : 'bg-[#FF1A1A]/12 text-[#FF5A5A] border-[#FF1A1A]/20'}`}>{st}{st!=='VIGENTE' ? ` · ${dd}d` : ''}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-[#0F0F0F] border border-white/[0.05] rounded-[12px] px-3 py-2.5">
                    <div className="text-[10px] tracking-[0.12em] font-bold text-white/30 flex items-center gap-1"><Calendar className="w-[10px] h-[10px]" /> ABONO</div>
                    <div className="mt-1 text-[13px] font-bold">{formatAR(c.fechaAbono)}</div>
                  </div>
                  <div className="bg-[#0F0F0F] border border-white/[0.05] rounded-[12px] px-3 py-2.5">
                    <div className="text-[10px] tracking-[0.12em] font-bold text-white/30 flex items-center gap-1"><Clock3 className="w-[10px] h-[10px]" /> VENCE</div>
                    <div className="mt-1 text-[13px] font-bold">{formatAR(c.fechaVenc)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[13px] font-bold text-white/70">${c.monto.toLocaleString('es-AR')}</div>
                  {c.nota && <div className="text-[11px] text-white/35 truncate max-w-[55%]">{c.nota}</div>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={whatsappLink(c)} target="_blank" rel="noopener noreferrer" className="h-[36px] px-3 rounded-[10px] bg-[#10B981]/12 hover:bg-[#10B981]/20 border border-[#10B981]/20 text-[#10B981] text-[12px] font-bold flex items-center gap-1.5 transition-all hover:scale-[1.03]"><MessageCircle className="w-[14px] h-[14px]" /> WhatsApp</a>
                  <button onClick={() => setShowTicket(c)} className="h-[36px] px-3 rounded-[10px] bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white/70 hover:text-white text-[12px] font-bold flex items-center gap-1.5 transition-all"><Ticket className="w-[14px] h-[14px]" /> Ticket</button>
                  <button onClick={() => renewClient(c)} className="h-[36px] px-3 rounded-[10px] bg-[#FF1A1A]/12 hover:bg-[#FF1A1A]/20 border border-[#FF1A1A]/20 text-[#FF6B6B] hover:text-[#FF1A1A] text-[12px] font-bold flex items-center gap-1.5 transition-all"><RefreshCw className="w-[14px] h-[14px]" /> Renovar</button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(c)} className="flex-1 h-[36px] rounded-[10px] bg-[#0F0F0F] border border-white/[0.06] hover:border-white/15 text-white/60 hover:text-white text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all"><Edit2 className="w-[13px] h-[13px]" /> Editar</button>
                  <button onClick={() => deleteClient(c.id)} className="w-[36px] h-[36px] rounded-[10px] bg-[#0F0F0F] border border-white/[0.06] hover:border-[#FF1A1A]/30 text-white/30 hover:text-[#FF1A1A] flex items-center justify-center transition-all"><Trash2 className="w-[14px] h-[14px]" /></button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length===0 && (
          <div className="mt-12 text-center py-16 bg-[#141414]/60 border border-white/[0.06] rounded-[20px]">
            <div className="text-[15px] font-bold text-white/30">Sin resultados</div>
            <div className="mt-1 text-[13px] text-white/20">Probá otro filtro o creá un cliente nuevo</div>
          </div>
        )}
      </main>

      {/* SETTINGS MODAL - hidden menu */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[12px]" onClick={() => setShowSettings(false)} />
          <div className="relative w-full md:max-w-[420px] bg-[#141414] border border-white/[0.08] md:rounded-[20px] rounded-t-[24px] p-6 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-[in_.22s_ease]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-[36px] h-[36px] rounded-[10px] bg-[#1A1A1A] border border-white/10 flex items-center justify-center"><Settings className="w-[18px] h-[18px] text-white/60" /></div>
                <div><div className="text-[14px] font-black tracking-[-0.01em]">Ajustes</div><div className="text-[11px] text-white/40">Gestión privada</div></div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-[36px] h-[36px] rounded-[12px] bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/[0.10]"><X className="w-[16px] h-[16px]" /></button>
            </div>
            <div className="mt-6 space-y-2">
              <button onClick={() => { setShowPassChange(true); }} className="w-full h-[48px] rounded-[12px] bg-[#0F0F0F] border border-white/[0.06] hover:border-[#FF1A1A]/25 hover:bg-[#1A1A1A] px-4 flex items-center gap-3 text-[13px] font-bold text-white/80 hover:text-white transition-all text-left">
                <KeyRound className="w-[16px] h-[16px] text-[#FF1A1A]" /> Cambiar contraseña
              </button>
              <button onClick={exportBackup} className="w-full h-[48px] rounded-[12px] bg-[#0F0F0F] border border-white/[0.06] hover:border-white/15 hover:bg-[#1A1A1A] px-4 flex items-center gap-3 text-[13px] font-bold text-white/70 hover:text-white transition-all text-left">
                <Download className="w-[16px] h-[16px]" /> Exportar respaldo (JSON)
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full h-[48px] rounded-[12px] bg-[#0F0F0F] border border-white/[0.06] hover:border-white/15 hover:bg-[#1A1A1A] px-4 flex items-center gap-3 text-[13px] font-bold text-white/70 hover:text-white transition-all text-left">
                <Upload className="w-[16px] h-[16px]" /> Importar respaldo
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={importBackup} />
              <button onClick={handleInstall} className="w-full h-[48px] rounded-[12px] bg-[#0F0F0F] border border-white/[0.06] hover:border-[#FF1A1A]/25 hover:bg-[#1A1A1A] px-4 flex items-center gap-3 text-[13px] font-bold text-white/70 hover:text-white transition-all text-left">
                <Smartphone className="w-[16px] h-[16px] text-white/60" /> Instalar App
              </button>
              <div className="pt-4 mt-2 border-t border-white/[0.06]">
                <button onClick={handleLogout} className="w-full h-[46px] rounded-[12px] bg-[#FF1A1A]/10 hover:bg-[#FF1A1A]/15 border border-[#FF1A1A]/20 text-[#FF6B6B] hover:text-[#FF1A1A] text-[13px] font-bold flex items-center justify-center gap-2 transition-all">
                  <LogOut className="w-[16px] h-[16px]" /> Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD CHANGE */}
      {showPassChange && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[12px]" onClick={() => setShowPassChange(false)} />
          <div className="relative w-full max-w-[380px] bg-[#141414] border border-[#FF1A1A]/20 rounded-[20px] p-6 shadow-[0_0_60px_rgba(255,26,26,0.25)]">
            <div className="flex items-center justify-between mb-5">
              <div className="text-[14px] font-black">Cambiar contraseña</div>
              <button onClick={() => setShowPassChange(false)} className="w-[32px] h-[32px] rounded-[10px] bg-white/5 flex items-center justify-center"><X className="w-[14px] h-[14px]" /></button>
            </div>
            <div className="space-y-4">
              <input type="password" value={passOld} onChange={e=>setPassOld(e.target.value)} placeholder="Actual" className="w-full h-[44px] bg-[#0F0F0F] border border-white/[0.07] rounded-[12px] px-4 text-[14px] outline-none focus:border-[#FF1A1A]/40" />
              <input type="password" value={passNew} onChange={e=>setPassNew(e.target.value)} placeholder="Nueva (min 6)" className="w-full h-[44px] bg-[#0F0F0F] border border-white/[0.07] rounded-[12px] px-4 text-[14px] outline-none focus:border-[#FF1A1A]/40" />
              {passMsg && <div className={`text-[12px] font-medium px-3 py-2 rounded-[10px] border ${passMsg.includes('¡') ? 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]' : 'bg-[#FF1A1A]/10 border-[#FF1A1A]/20 text-[#FF6B6B]'}`}>{passMsg}</div>}
              <button onClick={handleChangePass} className="w-full h-[44px] rounded-[12px] bg-[#FF1A1A] hover:bg-[#E10600] text-white font-black text-[13px] tracking-[0.04em] shadow-[0_0_20px_rgba(255,26,26,0.4)]">GUARDAR</button>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT FORM */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[14px]" onClick={() => setShowForm(false)} />
          <div className="relative w-full md:max-w-[520px] bg-[#141414] border border-white/[0.08] md:rounded-[22px] rounded-t-[24px] p-6 md:p-7 shadow-[0_0_80px_rgba(0,0,0,0.9)] max-h-[92vh] overflow-auto">
            <div className="flex items-center justify-between">
              <div className="text-[16px] font-black tracking-[-0.02em]">{editing ? 'Editar cliente' : 'Nuevo cliente'}</div>
              <button onClick={() => setShowForm(false)} className="w-[36px] h-[36px] rounded-[12px] bg-white/[0.06] border border-white/10 flex items-center justify-center"><X className="w-[16px] h-[16px]" /></button>
            </div>
            <div className="mt-6 space-y-4">
              <div><label className="text-[11px] tracking-[0.12em] font-bold text-white/40">NOMBRE</label><input value={formData.nombre} onChange={e=>setFormData({...formData, nombre:e.target.value})} className="mt-2 w-full h-[44px] bg-[#0F0F0F] border border-white/[0.07] rounded-[12px] px-4 text-[14px] outline-none focus:border-[#FF1A1A]/40" placeholder="Nombre completo" /></div>
              <div><label className="text-[11px] tracking-[0.12em] font-bold text-white/40">WHATSAPP</label><input value={formData.whatsapp} onChange={e=>setFormData({...formData, whatsapp:e.target.value})} className="mt-2 w-full h-[44px] bg-[#0F0F0F] border border-white/[0.07] rounded-[12px] px-4 text-[14px] outline-none focus:border-[#FF1A1A]/40" placeholder="+54911..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] tracking-[0.12em] font-bold text-white/40">ABONO</label><input type="date" value={formData.fechaAbono} onChange={e=>setFormData({...formData, fechaAbono:e.target.value})} className="mt-2 w-full h-[44px] bg-[#0F0F0F] border border-white/[0.07] rounded-[12px] px-3 text-[13px] outline-none focus:border-[#FF1A1A]/40" /></div>
                <div><label className="text-[11px] tracking-[0.12em] font-bold text-white/40">VENCIMIENTO</label><input type="date" value={formData.fechaVenc} onChange={e=>setFormData({...formData, fechaVenc:e.target.value})} className="mt-2 w-full h-[44px] bg-[#0F0F0F] border border-white/[0.07] rounded-[12px] px-3 text-[13px] outline-none focus:border-[#FF1A1A]/40" /></div>
              </div>
              <div><label className="text-[11px] tracking-[0.12em] font-bold text-white/40">MONTO $</label><input type="number" value={formData.monto} onChange={e=>setFormData({...formData, monto:Number(e.target.value)})} className="mt-2 w-full h-[44px] bg-[#0F0F0F] border border-white/[0.07] rounded-[12px] px-4 text-[14px] outline-none focus:border-[#FF1A1A]/40" /></div>
              <div><label className="text-[11px] tracking-[0.12em] font-bold text-white/40">NOTA</label><textarea value={formData.nota} onChange={e=>setFormData({...formData, nota:e.target.value})} rows={3} className="mt-2 w-full bg-[#0F0F0F] border border-white/[0.07] rounded-[12px] px-4 py-3 text-[13px] outline-none focus:border-[#FF1A1A]/40 resize-none" placeholder="Plan, horario..." /></div>
              <button onClick={saveClient} className="w-full h-[48px] rounded-[12px] bg-[#FF1A1A] hover:bg-[#E10600] text-white font-black tracking-[0.05em] text-[14px] shadow-[0_0_28px_rgba(255,26,26,0.45)] hover:shadow-[0_0_40px_rgba(255,26,26,0.65)] transition-all">GUARDAR CLIENTE</button>
            </div>
          </div>
        </div>
      )}

      {/* TICKET */}
      {showTicket && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-[16px]" onClick={() => setShowTicket(null)} />
          <div className="relative w-full max-w-[360px] bg-[#101010] border border-[#FF1A1A]/25 rounded-[22px] overflow-hidden shadow-[0_0_80px_rgba(255,26,26,0.25)]">
            <div className="h-[6px] bg-gradient-to-r from-[#FF1A1A] to-[#E10600]" />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1"><span className="text-[13px] font-black tracking-[-0.02em]">DINAMIC</span><span className="text-[13px] font-black tracking-[-0.02em] text-[#FF1A1A]">GYM</span></div>
                <span className="text-[10px] tracking-[0.14em] font-bold text-white/30">TICKET OFICIAL</span>
              </div>
              <div className="mt-6 text-center">
                <div className="inline-flex px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] tracking-[0.16em] font-bold text-white/50">{showTicket.id.slice(-6).toUpperCase()} • {formatAR(showTicket.fechaAbono)}</div>
                <div className="mt-4 text-[20px] font-black tracking-[-0.02em] leading-tight">{showTicket.nombre}</div>
                <div className="mt-1 text-[12px] text-white/40">{showTicket.whatsapp}</div>
              </div>
              <div className="mt-6 bg-[#0A0A0A] border border-white/[0.06] rounded-[14px] p-4 space-y-3">
                <div className="flex justify-between text-[12px]"><span className="text-white/40">Abono</span><span className="font-bold">{formatAR(showTicket.fechaAbono)}</span></div>
                <div className="flex justify-between text-[12px]"><span className="text-white/40">Vence</span><span className="font-bold">{formatAR(showTicket.fechaVenc)}</span></div>
                <div className="flex justify-between text-[12px]"><span className="text-white/40">Monto</span><span className="font-bold">${showTicket.monto.toLocaleString('es-AR')}</span></div>
                <div className="pt-3 border-t border-white/[0.06] flex justify-between items-center">
                  <span className="text-[11px] tracking-[0.12em] font-bold text-white/30">ESTADO</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-[0.08em] border ${statusOf(showTicket.fechaVenc)==='VIGENTE' ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/20' : statusOf(showTicket.fechaVenc)==='POR VENCER' ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/20' : 'bg-[#FF1A1A]/15 text-[#FF6B6B] border-[#FF1A1A]/20'}`}>{statusOf(showTicket.fechaVenc)}</span>
                </div>
                {showTicket.nota && <div className="text-[11px] text-white/35 pt-2">{showTicket.nota}</div>}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2">
                <button onClick={() => setShowTicket(null)} className="h-[42px] rounded-[12px] bg-white/[0.06] border border-white/10 text-[12px] font-bold">CERRAR</button>
                <a href={whatsappLink(showTicket)} target="_blank" rel="noopener noreferrer" className="h-[42px] rounded-[12px] bg-[#FF1A1A] hover:bg-[#E10600] text-white text-[12px] font-black flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,26,26,0.35)]"><MessageCircle className="w-[14px] h-[14px]" /> ENVIAR</a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .scrollbar-none::-webkit-scrollbar{display:none} .scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}
