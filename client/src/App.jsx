import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Target, CreditCard, PieChart, 
  X, Trash2, DollarSign, Mail, LogOut, RefreshCw, CheckCircle,
  ArrowUpCircle, ArrowDownCircle, Plus, Settings, Bell, Search,
  ChevronRight, Calendar, Filter, Download, Smartphone, Zap
} from 'lucide-react';

export default function NuevecincoApp() {
  // Estados principales
  const [activeTab, setActiveTab] = useState('inicio');
  const [showModal, setShowModal] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [user, setUser] = useState(null);
  
  // Estados de datos
  const [transacciones, setTransacciones] = useState([]);
  const [presupuestos, setPresupuestos] = useState([
    { id: 1, categoria: 'Alimentación', limite: 800000, color: '#10b981' },
    { id: 2, categoria: 'Transporte', limite: 400000, color: '#f59e0b' },
    { id: 3, categoria: 'Entretenimiento', limite: 300000, color: '#8b5cf6' },
    { id: 4, categoria: 'Servicios', limite: 500000, color: '#3b82f6' },
    { id: 5, categoria: 'Hogar', limite: 600000, color: '#ec4899' },
  ]);
  
  const [metas, setMetas] = useState([
    { id: 1, nombre: 'Fondo de emergencia', objetivo: 10000000, ahorrado: 2500000, color: '#10b981' },
    { id: 2, nombre: 'Vacaciones', objetivo: 5000000, ahorrado: 800000, color: '#3b82f6' },
  ]);
  
  const [deudas, setDeudas] = useState([]);

  // Formularios
  const [formTransaccion, setFormTransaccion] = useState({ 
    tipo: 'gasto', monto: '', categoria: '', descripcion: '', 
    fecha: new Date().toISOString().split('T')[0] 
  });
  const [formPresupuesto, setFormPresupuesto] = useState({ categoria: '', limite: '', color: '#10b981' });
  const [formMeta, setFormMeta] = useState({ nombre: '', objetivo: '', ahorrado: '0', color: '#10b981' });
  const [formDeuda, setFormDeuda] = useState({ nombre: '', total: '', pagado: '0', tasaInteres: '', fechaLimite: '' });
  const [formAporte, setFormAporte] = useState({ monto: '' });
  const [editingItem, setEditingItem] = useState(null);

  const categorias = [
    'Alimentación', 'Transporte', 'Entretenimiento', 'Servicios', 'Hogar', 
    'Salud', 'Educación', 'Ropa', 'Mercado', 'Compras Online', 'Transferencias',
    'Impuestos', 'Salario', 'Freelance', 'Inversiones', 'Otros'
  ];

  // Cargar tokens guardados
  useEffect(() => {
    const tokens = localStorage.getItem('gmail_tokens');
    const savedTransacciones = localStorage.getItem('transacciones');
    const savedPresupuestos = localStorage.getItem('presupuestos');
    const savedMetas = localStorage.getItem('metas');
    const savedDeudas = localStorage.getItem('deudas');
    
    if (tokens) {
      setIsAuthenticated(true);
      setUser(JSON.parse(localStorage.getItem('user_info') || '{}'));
    }
    if (savedTransacciones) setTransacciones(JSON.parse(savedTransacciones));
    if (savedPresupuestos) setPresupuestos(JSON.parse(savedPresupuestos));
    if (savedMetas) setMetas(JSON.parse(savedMetas));
    if (savedDeudas) setDeudas(JSON.parse(savedDeudas));
  }, []);

  // Guardar datos cuando cambien
  useEffect(() => {
    localStorage.setItem('transacciones', JSON.stringify(transacciones));
  }, [transacciones]);
  
  useEffect(() => {
    localStorage.setItem('presupuestos', JSON.stringify(presupuestos));
  }, [presupuestos]);
  
  useEffect(() => {
    localStorage.setItem('metas', JSON.stringify(metas));
  }, [metas]);
  
  useEffect(() => {
    localStorage.setItem('deudas', JSON.stringify(deudas));
  }, [deudas]);

  // Manejar callback de OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleAuthCallback(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  // Cálculos
  const mesActual = new Date().getMonth();
  const anioActual = new Date().getFullYear();
  
  const transaccionesMes = transacciones.filter(t => {
    const fecha = new Date(t.fecha);
    return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
  });

  const totalIngresos = transaccionesMes.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + t.monto, 0);
  const totalGastos = transaccionesMes.filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + t.monto, 0);
  const balance = totalIngresos - totalGastos;
  const totalAhorrado = metas.reduce((sum, m) => sum + m.ahorrado, 0);
  const totalDeuda = deudas.reduce((sum, d) => sum + (d.total - d.pagado), 0);

  const getGastosPorCategoria = (categoria) => {
    return transaccionesMes.filter(t => t.tipo === 'gasto' && t.categoria === categoria)
      .reduce((sum, t) => sum + t.monto, 0);
  };

  // Autenticación Gmail
  const handleGmailLogin = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/.netlify/functions/api/auth/url');
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar con Gmail');
      setIsLoading(false);
    }
  };

  const handleAuthCallback = async (code) => {
    try {
      setIsLoading(true);
      const response = await fetch('/.netlify/functions/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      if (data.tokens) {
        localStorage.setItem('gmail_tokens', JSON.stringify(data.tokens));
        setIsAuthenticated(true);
        setSyncStatus('success');
        await syncTransacciones(data.tokens);
      }
    } catch (error) {
      console.error('Error:', error);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const syncTransacciones = async (tokens = null) => {
    try {
      setIsLoading(true);
      setSyncStatus('syncing');
      
      const savedTokens = tokens || JSON.parse(localStorage.getItem('gmail_tokens'));
      if (!savedTokens) return;

      const response = await fetch('/.netlify/functions/api/gmail/transacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: savedTokens.access_token,
          refresh_token: savedTokens.refresh_token,
          desde: '2024/01/01'
        })
      });

      const data = await response.json();
      
      if (data.transacciones) {
        // Merge con transacciones existentes (evitar duplicados)
        const existingIds = new Set(transacciones.map(t => t.id));
        const newTransacciones = data.transacciones.filter(t => !existingIds.has(t.id));
        
        if (newTransacciones.length > 0) {
          setTransacciones(prev => [...newTransacciones, ...prev]);
        }
        
        setSyncStatus('success');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gmail_tokens');
    localStorage.removeItem('user_info');
    setIsAuthenticated(false);
    setUser(null);
  };

  // CRUD Handlers
  const handleAddTransaccion = () => {
    if (!formTransaccion.monto || !formTransaccion.categoria) return;
    const newTrans = { 
      ...formTransaccion, 
      id: `manual-${Date.now()}`, 
      monto: parseFloat(formTransaccion.monto),
      fuente: 'Manual'
    };
    setTransacciones([newTrans, ...transacciones]);
    setFormTransaccion({ tipo: 'gasto', monto: '', categoria: '', descripcion: '', fecha: new Date().toISOString().split('T')[0] });
    setShowModal(null);
  };

  const handleAddPresupuesto = () => {
    if (!formPresupuesto.categoria || !formPresupuesto.limite) return;
    const newPres = { ...formPresupuesto, id: Date.now(), limite: parseFloat(formPresupuesto.limite) };
    setPresupuestos([...presupuestos, newPres]);
    setFormPresupuesto({ categoria: '', limite: '', color: '#10b981' });
    setShowModal(null);
  };

  const handleAddMeta = () => {
    if (!formMeta.nombre || !formMeta.objetivo) return;
    const newMeta = { 
      ...formMeta, 
      id: Date.now(), 
      objetivo: parseFloat(formMeta.objetivo), 
      ahorrado: parseFloat(formMeta.ahorrado || 0) 
    };
    setMetas([...metas, newMeta]);
    setFormMeta({ nombre: '', objetivo: '', ahorrado: '0', color: '#10b981' });
    setShowModal(null);
  };

  const handleAddDeuda = () => {
    if (!formDeuda.nombre || !formDeuda.total) return;
    const newDeuda = { 
      ...formDeuda, 
      id: Date.now(), 
      total: parseFloat(formDeuda.total), 
      pagado: parseFloat(formDeuda.pagado || 0), 
      tasaInteres: parseFloat(formDeuda.tasaInteres || 0) 
    };
    setDeudas([...deudas, newDeuda]);
    setFormDeuda({ nombre: '', total: '', pagado: '0', tasaInteres: '', fechaLimite: '' });
    setShowModal(null);
  };

  const handleAporteMeta = (metaId) => {
    if (!formAporte.monto) return;
    setMetas(metas.map(m => m.id === metaId ? { ...m, ahorrado: m.ahorrado + parseFloat(formAporte.monto) } : m));
    setFormAporte({ monto: '' });
    setShowModal(null);
    setEditingItem(null);
  };

  const handlePagoDeuda = (deudaId) => {
    if (!formAporte.monto) return;
    setDeudas(deudas.map(d => d.id === deudaId ? { ...d, pagado: d.pagado + parseFloat(formAporte.monto) } : d));
    setFormAporte({ monto: '' });
    setShowModal(null);
    setEditingItem(null);
  };

  const deleteItem = (type, id) => {
    if (type === 'transaccion') setTransacciones(transacciones.filter(t => t.id !== id));
    if (type === 'presupuesto') setPresupuestos(presupuestos.filter(p => p.id !== id));
    if (type === 'meta') setMetas(metas.filter(m => m.id !== id));
    if (type === 'deuda') setDeudas(deudas.filter(d => d.id !== id));
  };

  // Componentes UI
  const Card = ({ children, className = '', gradient = false }) => (
    <div className={`rounded-3xl p-5 ${gradient ? '' : 'bg-white shadow-sm border border-gray-100'} ${className}`}>
      {children}
    </div>
  );

  const ProgressBar = ({ value, max, color, height = 'h-2' }) => (
    <div className={`w-full bg-gray-100 rounded-full ${height} overflow-hidden`}>
      <div 
        className={`${height} rounded-full transition-all duration-700 ease-out`} 
        style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }}
      />
    </div>
  );

  const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  const Input = ({ label, ...props }) => (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input 
        {...props} 
        className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition text-gray-900" 
      />
    </div>
  );

  const Select = ({ label, options, ...props }) => (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <select 
        {...props} 
        className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition text-gray-900 appearance-none"
      >
        <option value="">Seleccionar...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  const Button = ({ children, variant = 'primary', size = 'md', ...props }) => {
    const styles = {
      primary: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      danger: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30',
      outline: 'border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50'
    };
    const sizes = {
      sm: 'py-2 px-4 text-sm',
      md: 'py-3.5 px-6',
      lg: 'py-4 px-8 text-lg'
    };
    return (
      <button 
        {...props} 
        className={`w-full ${sizes[size]} rounded-2xl font-semibold transition-all duration-300 ${styles[variant]} disabled:opacity-50`}
      >
        {children}
      </button>
    );
  };

  // Vistas
  const LoginScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-black text-emerald-600">N9</span>
        </div>
        <h1 className="text-4xl font-black text-white mb-2">NUEVECINCO</h1>
        <p className="text-emerald-100 text-lg">Tu dinero, bajo control</p>
      </div>
      
      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleGmailLogin}
          disabled={isLoading}
          className="w-full bg-white text-gray-800 py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw size={22} className="animate-spin" />
          ) : (
            <Mail size={22} className="text-red-500" />
          )}
          {isLoading ? 'Conectando...' : 'Conectar con Gmail'}
        </button>
        
        <p className="text-emerald-100 text-sm text-center px-4">
          Sincroniza automáticamente tus transacciones de Bancolombia
        </p>
      </div>
      
      <div className="mt-12 grid grid-cols-3 gap-6 text-center">
        <div className="text-white/80">
          <Zap size={28} className="mx-auto mb-2" />
          <p className="text-xs">Automático</p>
        </div>
        <div className="text-white/80">
          <CreditCard size={28} className="mx-auto mb-2" />
          <p className="text-xs">Bancolombia</p>
        </div>
        <div className="text-white/80">
          <Target size={28} className="mx-auto mb-2" />
          <p className="text-xs">Metas</p>
        </div>
      </div>
    </div>
  );

  const TabInicio = () => (
    <div className="space-y-5">
      {/* Header con sync */}
      {isAuthenticated && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Conectado con Gmail</p>
          </div>
          <button 
            onClick={() => syncTransacciones()}
            disabled={isLoading}
            className="flex items-center gap-2 text-emerald-600 font-medium text-sm bg-emerald-50 px-4 py-2 rounded-full"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        </div>
      )}

      {/* Balance Principal */}
      <Card gradient className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-gray-400 text-sm mb-1">Balance del mes</p>
          <p className="text-4xl font-black tracking-tight mb-6">{formatMoney(balance)}</p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <ArrowUpCircle size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Ingresos</p>
                <p className="text-sm font-bold text-emerald-400">{formatMoney(totalIngresos)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <ArrowDownCircle size={20} className="text-red-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Gastos</p>
                <p className="text-sm font-bold text-red-400">{formatMoney(totalGastos)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Resumen Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Target size={16} className="text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-gray-600">Ahorros</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{formatMoney(totalAhorrado)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <CreditCard size={16} className="text-red-500" />
            </div>
            <span className="text-sm font-semibold text-gray-600">Deudas</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{formatMoney(totalDeuda)}</p>
        </Card>
      </div>

      {/* Últimos Movimientos */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Últimos Movimientos</h3>
          <button onClick={() => setActiveTab('transacciones')} className="text-emerald-600 text-sm font-semibold">
            Ver todo
          </button>
        </div>
        <div className="space-y-3">
          {transacciones.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${t.tipo === 'ingreso' ? 'bg-emerald-100' : 'bg-red-50'}`}>
                  {t.tipo === 'ingreso' ? 
                    <TrendingUp size={18} className="text-emerald-600" /> : 
                    <TrendingDown size={18} className="text-red-500" />
                  }
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.categoria}</p>
                  <p className="text-xs text-gray-500 truncate max-w-32">{t.descripcion || t.fuente}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${t.tipo === 'ingreso' ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {t.tipo === 'ingreso' ? '+' : '-'}{formatMoney(t.monto)}
                </p>
                <p className="text-xs text-gray-400">{formatDate(t.fecha)}</p>
              </div>
            </div>
          ))}
          {transacciones.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Mail size={40} className="mx-auto mb-2 opacity-50" />
              <p>Sin movimientos aún</p>
              <p className="text-sm">Sincroniza tu Gmail para comenzar</p>
            </div>
          )}
        </div>
      </Card>

      {/* Presupuestos Preview */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Presupuestos</h3>
          <button onClick={() => setActiveTab('presupuesto')} className="text-emerald-600 text-sm font-semibold">
            Ver todo
          </button>
        </div>
        <div className="space-y-4">
          {presupuestos.slice(0, 3).map(p => {
            const gastado = getGastosPorCategoria(p.categoria);
            const porcentaje = (gastado / p.limite) * 100;
            return (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">{p.categoria}</span>
                  <span className={porcentaje > 100 ? 'text-red-500 font-bold' : 'text-gray-500'}>
                    {formatMoney(gastado)} / {formatMoney(p.limite)}
                  </span>
                </div>
                <ProgressBar 
                  value={gastado} 
                  max={p.limite} 
                  color={porcentaje > 100 ? '#ef4444' : porcentaje > 80 ? '#f59e0b' : p.color} 
                  height="h-2.5"
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const TabTransacciones = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button 
          onClick={() => { setFormTransaccion({...formTransaccion, tipo: 'gasto'}); setShowModal('transaccion'); }} 
          className="flex-1 py-3.5 bg-red-50 text-red-600 rounded-2xl font-semibold flex items-center justify-center gap-2"
        >
          <TrendingDown size={18} /> Gasto
        </button>
        <button 
          onClick={() => { setFormTransaccion({...formTransaccion, tipo: 'ingreso'}); setShowModal('transaccion'); }} 
          className="flex-1 py-3.5 bg-emerald-50 text-emerald-600 rounded-2xl font-semibold flex items-center justify-center gap-2"
        >
          <TrendingUp size={18} /> Ingreso
        </button>
      </div>

      <Card>
        <h3 className="font-bold text-gray-900 mb-4">Historial</h3>
        <div className="space-y-2">
          {transacciones.map(t => (
            <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${t.tipo === 'ingreso' ? 'bg-emerald-100' : 'bg-red-50'}`}>
                  {t.tipo === 'ingreso' ? 
                    <TrendingUp size={18} className="text-emerald-600" /> : 
                    <TrendingDown size={18} className="text-red-500" />
                  }
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t.categoria}</p>
                  <p className="text-sm text-gray-500 truncate max-w-40">{t.descripcion}</p>
                  <p className="text-xs text-gray-400">{t.fecha} • {t.fuente}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className={`font-bold ${t.tipo === 'ingreso' ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {t.tipo === 'ingreso' ? '+' : '-'}{formatMoney(t.monto)}
                  </p>
                </div>
                <button 
                  onClick={() => deleteItem('transaccion', t.id)} 
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const TabPresupuesto = () => (
    <div className="space-y-4">
      <Button onClick={() => setShowModal('presupuesto')} variant="primary">
        <Plus size={18} className="inline mr-2" /> Nuevo Presupuesto
      </Button>

      <div className="space-y-3">
        {presupuestos.map(p => {
          const gastado = getGastosPorCategoria(p.categoria);
          const porcentaje = (gastado / p.limite) * 100;
          const restante = p.limite - gastado;
          return (
            <Card key={p.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-gray-900">{p.categoria}</h4>
                  <p className="text-sm text-gray-500">Límite: {formatMoney(p.limite)}</p>
                </div>
                <button 
                  onClick={() => deleteItem('presupuesto', p.id)} 
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <ProgressBar 
                value={gastado} 
                max={p.limite} 
                color={porcentaje > 100 ? '#ef4444' : porcentaje > 80 ? '#f59e0b' : p.color} 
                height="h-3"
              />
              <div className="flex justify-between mt-3 text-sm">
                <span className="text-gray-600">Gastado: <span className="font-semibold">{formatMoney(gastado)}</span></span>
                <span className={restante < 0 ? 'text-red-500 font-bold' : 'text-emerald-600 font-semibold'}>
                  {restante >= 0 ? `Disponible: ${formatMoney(restante)}` : `Excedido: ${formatMoney(Math.abs(restante))}`}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const TabMetas = () => (
    <div className="space-y-4">
      <Button onClick={() => setShowModal('meta')} variant="primary">
        <Plus size={18} className="inline mr-2" /> Nueva Meta
      </Button>

      <div className="space-y-3">
        {metas.map(m => {
          const porcentaje = (m.ahorrado / m.objetivo) * 100;
          return (
            <Card key={m.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-gray-900">{m.nombre}</h4>
                  <p className="text-sm text-gray-500">Meta: {formatMoney(m.objetivo)}</p>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => { setEditingItem(m); setShowModal('aporte-meta'); }} 
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                  >
                    <Plus size={16} />
                  </button>
                  <button 
                    onClick={() => deleteItem('meta', m.id)} 
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <ProgressBar value={m.ahorrado} max={m.objetivo} color={m.color} height="h-3" />
              <div className="flex justify-between mt-3 text-sm">
                <span className="text-gray-600">Ahorrado: <span className="font-semibold text-emerald-600">{formatMoney(m.ahorrado)}</span></span>
                <span className="font-bold text-gray-900">{porcentaje.toFixed(0)}%</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">Faltan: {formatMoney(m.objetivo - m.ahorrado)}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const TabDeudas = () => (
    <div className="space-y-4">
      <Button onClick={() => setShowModal('deuda')} variant="danger">
        <Plus size={18} className="inline mr-2" /> Nueva Deuda
      </Button>

      {totalDeuda > 0 && (
        <Card className="bg-red-50 border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <CreditCard className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Deuda Total Pendiente</p>
              <p className="text-2xl font-black text-red-700">{formatMoney(totalDeuda)}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {deudas.map(d => {
          const pendiente = d.total - d.pagado;
          const porcentaje = (d.pagado / d.total) * 100;
          return (
            <Card key={d.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-gray-900">{d.nombre}</h4>
                  <p className="text-sm text-gray-500">Total: {formatMoney(d.total)}</p>
                  {d.tasaInteres > 0 && <p className="text-xs text-orange-500">Interés: {d.tasaInteres}% anual</p>}
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => { setEditingItem(d); setShowModal('pago-deuda'); }} 
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                  >
                    <DollarSign size={16} />
                  </button>
                  <button 
                    onClick={() => deleteItem('deuda', d.id)} 
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <ProgressBar value={d.pagado} max={d.total} color="#10b981" height="h-3" />
              <div className="flex justify-between mt-3 text-sm">
                <span className="text-emerald-600 font-semibold">Pagado: {formatMoney(d.pagado)}</span>
                <span className="text-red-500 font-semibold">Pendiente: {formatMoney(pendiente)}</span>
              </div>
              {d.fechaLimite && <p className="text-xs text-gray-400 mt-1">Fecha límite: {d.fechaLimite}</p>}
            </Card>
          );
        })}
        {deudas.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <CheckCircle size={48} className="mx-auto mb-3 text-emerald-300" />
            <p className="font-medium text-gray-500">¡Sin deudas!</p>
            <p className="text-sm">Mantén este buen hábito</p>
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: Wallet },
    { id: 'transacciones', label: 'Movimientos', icon: TrendingUp },
    { id: 'presupuesto', label: 'Presupuesto', icon: PieChart },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'deudas', label: 'Deudas', icon: CreditCard },
  ];

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 py-4 sticky top-0 z-40 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">N9</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">NUEVECINCO</h1>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowModal('config')}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition"
            >
              <Settings size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {activeTab === 'inicio' && <TabInicio />}
        {activeTab === 'transacciones' && <TabTransacciones />}
        {activeTab === 'presupuesto' && <TabPresupuesto />}
        {activeTab === 'metas' && <TabMetas />}
        {activeTab === 'deudas' && <TabDeudas />}
      </div>

      {/* FAB para agregar rápido */}
      <button
        onClick={() => setShowModal('transaccion')}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg shadow-emerald-500/40 flex items-center justify-center text-white z-40"
      >
        <Plus size={26} />
      </button>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-area-bottom">
        <div className="flex justify-around py-2 px-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-4 rounded-2xl transition-all ${
                activeTab === tab.id 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-gray-400'
              }`}
            >
              <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modales */}
      {showModal === 'transaccion' && (
        <Modal title={formTransaccion.tipo === 'ingreso' ? '💵 Nuevo Ingreso' : '💸 Nuevo Gasto'} onClose={() => setShowModal(null)}>
          <div className="flex gap-2 mb-5">
            <button 
              onClick={() => setFormTransaccion({...formTransaccion, tipo: 'gasto'})} 
              className={`flex-1 py-3 rounded-xl font-semibold transition ${formTransaccion.tipo === 'gasto' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Gasto
            </button>
            <button 
              onClick={() => setFormTransaccion({...formTransaccion, tipo: 'ingreso'})} 
              className={`flex-1 py-3 rounded-xl font-semibold transition ${formTransaccion.tipo === 'ingreso' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Ingreso
            </button>
          </div>
          <Input label="Monto" type="number" placeholder="0" value={formTransaccion.monto} onChange={e => setFormTransaccion({...formTransaccion, monto: e.target.value})} />
          <Select label="Categoría" options={categorias} value={formTransaccion.categoria} onChange={e => setFormTransaccion({...formTransaccion, categoria: e.target.value})} />
          <Input label="Descripción" placeholder="Descripción del movimiento" value={formTransaccion.descripcion} onChange={e => setFormTransaccion({...formTransaccion, descripcion: e.target.value})} />
          <Input label="Fecha" type="date" value={formTransaccion.fecha} onChange={e => setFormTransaccion({...formTransaccion, fecha: e.target.value})} />
          <Button onClick={handleAddTransaccion} variant={formTransaccion.tipo === 'ingreso' ? 'primary' : 'danger'}>
            Guardar
          </Button>
        </Modal>
      )}

      {showModal === 'presupuesto' && (
        <Modal title="📊 Nuevo Presupuesto" onClose={() => setShowModal(null)}>
          <Select label="Categoría" options={categorias.filter(c => !presupuestos.find(p => p.categoria === c))} value={formPresupuesto.categoria} onChange={e => setFormPresupuesto({...formPresupuesto, categoria: e.target.value})} />
          <Input label="Límite Mensual" type="number" placeholder="0" value={formPresupuesto.limite} onChange={e => setFormPresupuesto({...formPresupuesto, limite: e.target.value})} />
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
            <input type="color" value={formPresupuesto.color} onChange={e => setFormPresupuesto({...formPresupuesto, color: e.target.value})} className="w-full h-14 rounded-2xl cursor-pointer border-0" />
          </div>
          <Button onClick={handleAddPresupuesto}>Guardar Presupuesto</Button>
        </Modal>
      )}

      {showModal === 'meta' && (
        <Modal title="🎯 Nueva Meta de Ahorro" onClose={() => setShowModal(null)}>
          <Input label="Nombre de la meta" placeholder="Ej: Vacaciones, Auto, etc." value={formMeta.nombre} onChange={e => setFormMeta({...formMeta, nombre: e.target.value})} />
          <Input label="Monto objetivo" type="number" placeholder="0" value={formMeta.objetivo} onChange={e => setFormMeta({...formMeta, objetivo: e.target.value})} />
          <Input label="Monto inicial ahorrado" type="number" placeholder="0" value={formMeta.ahorrado} onChange={e => setFormMeta({...formMeta, ahorrado: e.target.value})} />
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
            <input type="color" value={formMeta.color} onChange={e => setFormMeta({...formMeta, color: e.target.value})} className="w-full h-14 rounded-2xl cursor-pointer border-0" />
          </div>
          <Button onClick={handleAddMeta}>Crear Meta</Button>
        </Modal>
      )}

      {showModal === 'deuda' && (
        <Modal title="💳 Nueva Deuda" onClose={() => setShowModal(null)}>
          <Input label="Nombre" placeholder="Ej: Tarjeta Visa, Préstamo banco" value={formDeuda.nombre} onChange={e => setFormDeuda({...formDeuda, nombre: e.target.value})} />
          <Input label="Monto Total" type="number" placeholder="0" value={formDeuda.total} onChange={e => setFormDeuda({...formDeuda, total: e.target.value})} />
          <Input label="Monto ya pagado" type="number" placeholder="0" value={formDeuda.pagado} onChange={e => setFormDeuda({...formDeuda, pagado: e.target.value})} />
          <Input label="Tasa de interés anual (%)" type="number" placeholder="0" value={formDeuda.tasaInteres} onChange={e => setFormDeuda({...formDeuda, tasaInteres: e.target.value})} />
          <Input label="Fecha límite de pago" type="date" value={formDeuda.fechaLimite} onChange={e => setFormDeuda({...formDeuda, fechaLimite: e.target.value})} />
          <Button onClick={handleAddDeuda} variant="danger">Agregar Deuda</Button>
        </Modal>
      )}

      {showModal === 'aporte-meta' && editingItem && (
        <Modal title={`💰 Aportar a: ${editingItem.nombre}`} onClose={() => { setShowModal(null); setEditingItem(null); }}>
          <div className="text-center mb-5 p-4 bg-emerald-50 rounded-2xl">
            <p className="text-gray-500 text-sm">Ahorrado actual</p>
            <p className="text-3xl font-black text-emerald-600">{formatMoney(editingItem.ahorrado)}</p>
            <p className="text-sm text-gray-400">de {formatMoney(editingItem.objetivo)}</p>
          </div>
          <Input label="Monto a aportar" type="number" placeholder="0" value={formAporte.monto} onChange={e => setFormAporte({monto: e.target.value})} />
          <Button onClick={() => handleAporteMeta(editingItem.id)}>Agregar Aporte</Button>
        </Modal>
      )}

      {showModal === 'pago-deuda' && editingItem && (
        <Modal title={`💳 Pagar: ${editingItem.nombre}`} onClose={() => { setShowModal(null); setEditingItem(null); }}>
          <div className="text-center mb-5 p-4 bg-red-50 rounded-2xl">
            <p className="text-gray-500 text-sm">Pendiente por pagar</p>
            <p className="text-3xl font-black text-red-500">{formatMoney(editingItem.total - editingItem.pagado)}</p>
          </div>
          <Input label="Monto a pagar" type="number" placeholder="0" value={formAporte.monto} onChange={e => setFormAporte({monto: e.target.value})} />
          <Button onClick={() => handlePagoDeuda(editingItem.id)}>Registrar Pago</Button>
        </Modal>
      )}

      {showModal === 'config' && (
        <Modal title="⚙️ Configuración" onClose={() => setShowModal(null)}>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="text-red-500" size={24} />
                <div>
                  <p className="font-semibold">Gmail conectado</p>
                  <p className="text-sm text-gray-500">Sincronización automática activa</p>
                </div>
              </div>
              <button 
                onClick={() => syncTransacciones()}
                disabled={isLoading}
                className="w-full py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                Sincronizar ahora
              </button>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        </Modal>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
}
