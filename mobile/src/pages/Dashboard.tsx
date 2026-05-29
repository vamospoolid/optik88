import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  UserPlus, Activity, ShoppingCart, Package, BookOpen, BarChart3,
  TrendingUp, Clock, AlertTriangle, ArrowRight, User, DollarSign,
  LogOut, Wallet, ChevronRight, MessageCircle
} from 'lucide-react';
import { transactionsService, patientsService, stockService, examinationsService } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ['transactions'],
    queryFn: transactionsService.getAll,
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  const { data: stockItems = [] } = useQuery<any[]>({
    queryKey: ['stock'],
    queryFn: stockService.getAll,
  });

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ['examinations'],
    queryFn: examinationsService.getAll,
  });

  const stats = useMemo(() => {
    const today = new Date();
    const todayTrx = transactions.filter(t => {
      const d = new Date(t.created_at);
      return d.getDate() === today.getDate() &&
             d.getMonth() === today.getMonth() &&
             d.getFullYear() === today.getFullYear();
    });
    const todayRevenue = todayTrx
      .filter(t => t.payment_status === 'lunas' || t.payment_status === 'dp')
      .reduce((sum, t) => sum + t.paid_amount, 0);
    const lowStockCount = stockItems.filter(
      item => item.category !== 'service' && item.stock <= item.min_stock
    ).length;
    const pendingOrdersCount = transactions.filter(
      t => t.order_status === 'pending' || t.order_status === 'diproses'
    ).length;
    return { todayRevenue, lowStockCount, pendingOrdersCount, totalPatients: patients.length };
  }, [transactions, patients, stockItems]);

  const reminderPatients = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return patients.filter(p => {
      if (!p.created_at) return false;
      return new Date(p.created_at) < sixMonthsAgo;
    });
  }, [patients]);

  const quickActions = [
    { icon: UserPlus,   label: 'Pasien Baru',  color: '#4F46E5', bg: '#EEF2FF', onClick: () => navigate('/pasien?add=true'), roles: ['admin','kasir','optometris'] },
    { icon: Activity,   label: 'Pemeriksaan',  color: '#0891B2', bg: '#ECFEFF', onClick: () => navigate('/periksa'),         roles: ['admin','optometris'] },
    { icon: ShoppingCart,label:'Order Baru',   color: '#7C3AED', bg: '#F5F3FF', onClick: () => navigate('/order/baru'),      roles: ['admin','kasir'] },
    { icon: Package,    label: 'Inventori',    color: '#D97706', bg: '#FFFBEB', onClick: () => navigate('/stok'),            roles: ['admin'] },
    { icon: BookOpen,   label: 'Buku Kas',     color: '#059669', bg: '#ECFDF5', onClick: () => navigate('/kas'),             roles: ['admin','kasir','owner'] },
    { icon: BarChart3,  label: 'Laporan',      color: '#DB2777', bg: '#FDF2F8', onClick: () => navigate('/laporan'),         roles: ['admin','owner'] },
  ].filter(a => user && a.roles.includes(user.role));

  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page-scroll animate-fade-in" style={{ background: '#F4F6FF' }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: 'linear-gradient(145deg, #1A22C7 0%, #2B35E8 55%, #4F46E5 100%)',
        padding: '1.25rem 1.125rem 1.625rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position:'absolute', top:-40, right:-30, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-50, left:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />

        {/* Top row: greeting + logout */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative', zIndex:1 }}>
          <div>
            <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.72)', fontWeight:500, marginBottom:'2px' }}>
              {getGreeting()},
            </div>
            <div style={{ fontSize:'1.375rem', fontWeight:800, color:'white', lineHeight:1.2 }}>
              {user?.name || 'Kasir'}
            </div>
            <div style={{ marginTop:'6px' }}>
              <span style={{
                fontSize:'0.625rem', fontWeight:700, letterSpacing:'0.08em',
                textTransform:'uppercase', color:'rgba(255,255,255,0.9)',
                background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.25)',
                padding:'2px 10px', borderRadius:'999px',
              }}>
                {user?.role || 'staff'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Keluar"
            style={{
              width:42, height:42, borderRadius:'50%',
              background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'white', cursor:'pointer', flexShrink:0,
              backdropFilter:'blur(6px)',
            }}
          >
            <LogOut size={17} />
          </button>
        </div>

        {/* Date */}
        <div style={{ fontSize:'0.6875rem', color:'rgba(255,255,255,0.55)', marginTop:'6px', position:'relative', zIndex:1 }}>
          {dateStr}
        </div>
      </div>

      {/* ── REVENUE CARD (floating, overlapping hero bottom) ── */}
      <div style={{ padding: '0 1rem', marginTop: '-1px' }}>
        <div
          onClick={() => navigate('/kas')}
          className="ripple"
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.125rem 1.25rem',
            boxShadow: '0 8px 32px rgba(43,53,232,0.14)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            border: '1px solid rgba(43,53,232,0.07)',
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: '16px', flexShrink:0,
            background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
          }}>
            <Wallet size={24} color="white" />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'2px' }}>
              <TrendingUp size={12} color="#059669" />
              <span style={{ fontSize:'0.6875rem', fontWeight:700, color:'#059669', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Kas Masuk Hari Ini
              </span>
            </div>
            <div style={{ fontSize:'1.625rem', fontWeight:900, color:'#064E3B', lineHeight:1.1, letterSpacing:'-0.02em' }}>
              {rp(stats.todayRevenue)}
            </div>
            <div style={{ fontSize:'0.6rem', color:'#6B7280', marginTop:'3px' }}>
              Ketuk untuk lihat Buku Kas lengkap
            </div>
          </div>
          <ChevronRight size={18} color="#9CA3AF" />
        </div>
      </div>

      {/* ── 3 STAT CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.625rem', padding:'1rem 1rem 0' }}>
        {/* Pending Order */}
        <div
          className="ripple"
          onClick={() => navigate('/transaksi?status=pending')}
          style={{
            background:'white', borderRadius:'16px',
            padding:'0.875rem 0.75rem',
            boxShadow:'0 2px 12px rgba(43,53,232,0.07)',
            cursor:'pointer', textAlign:'center',
            border:'1px solid rgba(245,158,11,0.12)',
          }}
        >
          <div style={{
            width:38, height:38, borderRadius:'12px',
            background:'#FFFBEB', display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 0.5rem',
          }}>
            <Clock size={18} color="#D97706" />
          </div>
          <div style={{ fontSize:'1.375rem', fontWeight:800, color:'#111827', lineHeight:1 }}>
            {stats.pendingOrdersCount}
          </div>
          <div style={{ fontSize:'0.6rem', color:'#6B7280', marginTop:'3px', fontWeight:600, lineHeight:1.3 }}>
            Pending Order
          </div>
        </div>

        {/* Stok Menipis */}
        <div
          className="ripple"
          onClick={() => navigate('/stok?status=MENIPIS')}
          style={{
            background:'white', borderRadius:'16px',
            padding:'0.875rem 0.75rem',
            boxShadow:'0 2px 12px rgba(43,53,232,0.07)',
            cursor:'pointer', textAlign:'center',
            border: stats.lowStockCount > 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(43,53,232,0.05)',
          }}
        >
          <div style={{
            width:38, height:38, borderRadius:'12px',
            background: stats.lowStockCount > 0 ? '#FEF2F2' : '#F0FDF4',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 0.5rem',
          }}>
            <AlertTriangle size={18} color={stats.lowStockCount > 0 ? '#DC2626' : '#16A34A'} />
          </div>
          <div style={{ fontSize:'1.375rem', fontWeight:800, color: stats.lowStockCount > 0 ? '#DC2626' : '#111827', lineHeight:1 }}>
            {stats.lowStockCount}
          </div>
          <div style={{ fontSize:'0.6rem', color:'#6B7280', marginTop:'3px', fontWeight:600, lineHeight:1.3 }}>
            Stok Menipis
          </div>
        </div>

        {/* Total Pasien */}
        <div
          className="ripple"
          onClick={() => navigate('/pasien')}
          style={{
            background:'white', borderRadius:'16px',
            padding:'0.875rem 0.75rem',
            boxShadow:'0 2px 12px rgba(43,53,232,0.07)',
            cursor:'pointer', textAlign:'center',
            border:'1px solid rgba(43,53,232,0.07)',
          }}
        >
          <div style={{
            width:38, height:38, borderRadius:'12px',
            background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 0.5rem',
          }}>
            <User size={18} color="#4F46E5" />
          </div>
          <div style={{ fontSize:'1.375rem', fontWeight:800, color:'#111827', lineHeight:1 }}>
            {stats.totalPatients}
          </div>
          <div style={{ fontSize:'0.6rem', color:'#6B7280', marginTop:'3px', fontWeight:600, lineHeight:1.3 }}>
            Total Pasien
          </div>
        </div>
      </div>

      {/* ── MENU CEPAT ── */}
      <div style={{ padding:'1.25rem 1rem 0' }}>
        <div style={{ fontSize:'0.875rem', fontWeight:800, color:'#111827', marginBottom:'0.875rem' }}>
          Menu Cepat
        </div>
        <div style={{
          display:'grid',
          gridTemplateColumns: quickActions.length <= 3 ? `repeat(${quickActions.length}, 1fr)` : 'repeat(3, 1fr)',
          gap:'0.625rem',
        }}>
          {quickActions.map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                className="ripple"
                onClick={act.onClick}
                style={{
                  background:'white', borderRadius:'18px',
                  border:'1px solid rgba(0,0,0,0.05)',
                  padding:'0.875rem 0.5rem 0.75rem',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem',
                  boxShadow:'0 2px 10px rgba(0,0,0,0.06)',
                  cursor:'pointer', transition:'transform 0.15s',
                }}
              >
                <div style={{
                  width:48, height:48, borderRadius:'15px',
                  background:act.bg, display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Icon size={22} color={act.color} />
                </div>
                <span style={{
                  fontSize:'0.6875rem', fontWeight:700,
                  color:'#374151', textAlign:'center', lineHeight:1.25,
                }}>
                  {act.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TRANSAKSI TERAKHIR ── */}
      <div style={{ padding:'1.375rem 1rem 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
          <span style={{ fontSize:'0.875rem', fontWeight:800, color:'#111827' }}>Transaksi Terakhir</span>
          <button
            onClick={() => navigate('/transaksi')}
            style={{ display:'flex', alignItems:'center', gap:'3px', background:'none', border:'none',
              fontSize:'0.75rem', fontWeight:700, color:'#4F46E5', cursor:'pointer' }}
          >
            Lihat Semua <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {transactions.length === 0 ? (
            <div style={{
              background:'white', borderRadius:'16px', padding:'1.5rem', textAlign:'center',
              boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
            }}>
              <DollarSign size={32} color="#D1D5DB" style={{ margin:'0 auto 0.5rem' }} />
              <p style={{ fontSize:'0.8125rem', color:'#9CA3AF', fontWeight:500 }}>Belum ada transaksi hari ini</p>
            </div>
          ) : (
            transactions.slice(0, 5).map((trx: any) => {
              const patientName = patients.find((p: any) => p.id === trx.patient_id)?.name || 'Umum';
              const isLunas = trx.payment_status === 'lunas';
              const isDp = trx.payment_status === 'dp';
              return (
                <div
                  key={trx.id}
                  className="ripple"
                  onClick={() => navigate(`/transaksi/${trx.id}`)}
                  style={{
                    background:'white', borderRadius:'16px',
                    padding:'0.875rem 1rem',
                    display:'flex', alignItems:'center', gap:'0.875rem',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
                    cursor:'pointer',
                    border: isLunas ? '1px solid rgba(16,185,129,0.12)' : '1px solid rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{
                    width:42, height:42, borderRadius:'13px', flexShrink:0,
                    background: isLunas ? '#ECFDF5' : isDp ? '#FFFBEB' : '#FEF2F2',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <DollarSign size={19} color={isLunas ? '#059669' : isDp ? '#D97706' : '#DC2626'} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.8125rem', fontWeight:700, color:'#111827', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {trx.invoice_number}
                    </div>
                    <div style={{ fontSize:'0.6875rem', color:'#6B7280', marginTop:'2px' }}>
                      {patientName}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:'0.8125rem', fontWeight:800, color:'#111827' }}>
                      {rp(trx.total_amount)}
                    </div>
                    <span style={{
                      display:'inline-block', marginTop:'3px',
                      fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.05em',
                      padding:'2px 8px', borderRadius:'999px',
                      background: isLunas ? '#D1FAE5' : isDp ? '#FEF3C7' : '#FEE2E2',
                      color: isLunas ? '#065F46' : isDp ? '#92400E' : '#991B1B',
                    }}>
                      {trx.payment_status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── ANTREAN PERIKSA KLINIS ── */}
      <div style={{ padding:'1.375rem 1rem 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
          <span style={{ fontSize:'0.875rem', fontWeight:800, color:'#111827' }}>Antrean Periksa Klinis</span>
          <button
            onClick={() => navigate('/periksa')}
            style={{ display:'flex', alignItems:'center', gap:'3px', background:'none', border:'none',
              fontSize:'0.75rem', fontWeight:700, color:'#4F46E5', cursor:'pointer' }}
          >
            Lihat Semua <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'2rem' }}>
          {exams.length === 0 ? (
            <div style={{
              background:'white', borderRadius:'16px', padding:'1.5rem', textAlign:'center',
              boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
            }}>
              <Activity size={32} color="#D1D5DB" style={{ margin:'0 auto 0.5rem' }} />
              <p style={{ fontSize:'0.8125rem', color:'#9CA3AF', fontWeight:500 }}>Belum ada pemeriksaan hari ini</p>
            </div>
          ) : (
            exams.slice(0, 3).map((ex: any) => {
              const patient = patients.find((p: any) => p.id === ex.patient_id);
              const isInternal = ex.source === 'internal';
              return (
                <div
                  key={ex.id}
                  className="ripple"
                  onClick={() => navigate('/periksa')}
                  style={{
                    background:'white', borderRadius:'16px',
                    padding:'0.875rem 1rem',
                    display:'flex', alignItems:'center', gap:'0.875rem',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
                    cursor:'pointer',
                    border:`1px solid ${isInternal ? 'rgba(79,70,229,0.1)' : 'rgba(217,119,6,0.1)'}`,
                  }}
                >
                  <div style={{
                    width:42, height:42, borderRadius:'13px', flexShrink:0,
                    background: isInternal ? '#EEF2FF' : '#FFFBEB',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Activity size={19} color={isInternal ? '#4F46E5' : '#D97706'} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.8125rem', fontWeight:700, color:'#111827' }}>
                      {patient?.name || 'Pasien Baru'}
                    </div>
                    <div style={{ fontSize:'0.6875rem', color:'#6B7280', marginTop:'2px' }}>
                      {new Date(ex.exam_date).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                    </div>
                  </div>
                  <span style={{
                    fontSize:'0.6rem', fontWeight:700,
                    padding:'3px 9px', borderRadius:'999px',
                    background: isInternal ? '#EEF2FF' : '#FFFBEB',
                    color: isInternal ? '#4F46E5' : '#D97706',
                    border: `1px solid ${isInternal ? 'rgba(79,70,229,0.2)' : 'rgba(217,119,6,0.2)'}`,
                    letterSpacing:'0.04em', textTransform:'uppercase',
                  }}>
                    {isInternal ? 'Internal' : 'Rujukan'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── PENGINGAT CEK MATA (CRM) ── */}
      <div style={{ padding:'1.375rem 1rem 2rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
          <span style={{ fontSize:'0.875rem', fontWeight:800, color:'#1D4ED8' }}>Pengingat Cek Mata (6 Bln)</span>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {reminderPatients.length === 0 ? (
            <div style={{
              background:'white', borderRadius:'16px', padding:'1.5rem', textAlign:'center',
              boxShadow:'0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #DBEAFE'
            }}>
              <p style={{ fontSize:'0.8125rem', color:'#9CA3AF', fontWeight:500 }}>Belum ada pasien yang melewati batas 6 bulan.</p>
            </div>
          ) : (
            reminderPatients.slice(0, 3).map((pat: any) => {
              return (
                <div
                  key={pat.id}
                  style={{
                    background:'white', borderRadius:'16px',
                    padding:'0.875rem 1rem',
                    display:'flex', alignItems:'center', gap:'0.875rem',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
                    border: '1px solid #DBEAFE',
                  }}
                >
                  <div style={{
                    width:42, height:42, borderRadius:'13px', flexShrink:0,
                    background: '#EFF6FF',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <User size={19} color="#1D4ED8" />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.8125rem', fontWeight:700, color:'#1E40AF' }}>
                      {pat.name}
                    </div>
                    <div style={{ fontSize:'0.6875rem', color:'#6B7280', marginTop:'2px' }}>
                      Terakhir: {new Date(pat.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!pat.phone) return alert('No HP tidak tersedia');
                      let cleaned = pat.phone.replace(/\\D/g, '');
                      if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
                      const waMsg = encodeURIComponent(`Halo Kak *${pat.name}*, dari catatan kami sudah lebih dari 6 bulan sejak kunjungan terakhir Anda ke *Optik 88*. \n\nYuk jadwalkan cek mata gratis untuk memastikan ukuran kacamata Anda masih nyaman! 😊`);
                      window.open(`https://wa.me/${cleaned}?text=${waMsg}`, '_blank');
                    }}
                    style={{
                      background: '#25D366', color: 'white', border: 'none',
                      padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem',
                      fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <MessageCircle size={14} /> Sapa
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
