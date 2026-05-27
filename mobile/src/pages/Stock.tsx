import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, X, Loader2, Package, AlertTriangle, DollarSign, Trash2 } from 'lucide-react';
import { stockService } from '../services/api';

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Stock() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [activeStatus, setActiveStatus] = useState<string>('ALL');

  // Modal / Bottom Sheet Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAdjustForm, setShowAdjustForm] = useState<any>(null);

  // Add / Edit Form variables
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<'frame' | 'lens' | 'accessory' | 'service'>('frame');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [originalPrice, setOriginalPrice] = useState('0');
  const [sellPrice, setSellPrice] = useState('0');

  // Adjustment variable
  const [adjustmentValue, setAdjustmentValue] = useState('');

  // Queries
  const { data: stockItems = [], isLoading } = useQuery<any[]>({
    queryKey: ['stock'],
    queryFn: stockService.getAll,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: stockService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      handleCloseForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => stockService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      handleCloseForm();
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, value }: { id: string, value: number }) => stockService.adjust(id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setShowAdjustForm(null);
      setAdjustmentValue('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stockService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      handleCloseForm();
    },
  });

  const handleDeleteItem = () => {
    if (!editingItem) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus barang "${editingItem.name}"?`)) {
      deleteMutation.mutate(editingItem.id);
    }
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setName('');
    setSku('');
    setCategory('frame');
    setStock('0');
    setMinStock('5');
    setOriginalPrice('0');
    setSellPrice('0');
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setSku(item.sku);
    setCategory(item.category);
    setStock(item.stock.toString());
    setMinStock(item.min_stock.toString());
    setOriginalPrice((item.modal_price || 0).toString());
    setSellPrice(item.sell_price.toString());
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;

    const data = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      stock: parseInt(stock) || 0,
      min_stock: parseInt(minStock) || 0,
      modal_price: parseFloat(originalPrice) || 0,
      sell_price: parseFloat(sellPrice) || 0,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(adjustmentValue);
    if (isNaN(val) || !showAdjustForm) return;

    adjustMutation.mutate({ id: showAdjustForm.id, value: val });
  };

  // Stock statistics calculations
  const stats = useMemo(() => {
    const totalItems = stockItems.length;
    const lowStock = stockItems.filter(item => item.category !== 'service' && item.stock <= item.min_stock && item.stock > 0).length;
    const outOfStock = stockItems.filter(item => item.category !== 'service' && item.stock <= 0).length;
    const totalVal = stockItems.filter(item => item.category !== 'service').reduce((sum, item) => sum + (item.sell_price * item.stock), 0);

    return { totalItems, lowStock, outOfStock, totalVal };
  }, [stockItems]);

  // Filter logic
  const filteredStock = useMemo(() => {
    return stockItems.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      const matchCategory = activeCategory === 'ALL' || item.category === activeCategory;
      if (!matchCategory) return false;

      if (activeStatus === 'ALL') return true;
      if (activeStatus === 'MENIPIS') {
        return item.category !== 'service' && item.stock <= item.min_stock && item.stock > 0;
      }
      if (activeStatus === 'HABIS') {
        return item.category !== 'service' && item.stock <= 0;
      }
      return true;
    });
  }, [stockItems, search, activeCategory, activeStatus]);

  // Live profit calculation inside form
  const formProfit = useMemo(() => {
    const buy = parseFloat(originalPrice) || 0;
    const sell = parseFloat(sellPrice) || 0;
    const profit = sell - buy;
    const margin = sell > 0 ? Math.round((profit / sell) * 100) : 0;
    return { profit, margin };
  }, [originalPrice, sellPrice]);

  const categories = [
    { id: 'ALL', label: 'Semua Kategori' },
    { id: 'frame', label: 'Frame' },
    { id: 'lens', label: 'Lensa' },
    { id: 'accessory', label: 'Aksesoris' },
    { id: 'service', label: 'Jasa' }
  ];

  const statuses = [
    { id: 'ALL', label: 'Semua Status' },
    { id: 'MENIPIS', label: 'Stok Menipis' },
    { id: 'HABIS', label: 'Stok Habis' }
  ];

  return (
    <div className="page-scroll animate-fade-in" style={{ paddingBottom: '6rem' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <span className="top-bar-title">Stok Inventori</span>
        <button className="top-bar-action" onClick={() => setShowAddForm(true)} aria-label="Tambah Barang">
          <Plus size={20} />
        </button>
      </div>

      {/* Stats Widgets Panel */}
      <div style={{ display: 'flex', gap: '0.625rem', padding: '0.875rem 1rem', overflowX: 'auto', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ flex: '0 0 120px', background: 'var(--primary-light)', padding: '10px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
            <Package size={13} />
            <span style={{ fontSize: '0.625rem', fontWeight: 700 }}>TOTAL ITEM</span>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>{stats.totalItems}</div>
        </div>

        <div style={{ flex: '0 0 120px', background: 'var(--warning-light)', padding: '10px', borderRadius: '14px', border: '1px solid #fef3c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309' }}>
            <AlertTriangle size={13} />
            <span style={{ fontSize: '0.625rem', fontWeight: 700 }}>STOK MENIPIS</span>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, marginTop: '2px', color: '#b45309' }}>{stats.lowStock}</div>
        </div>

        <div style={{ flex: '0 0 120px', background: 'var(--danger-light)', padding: '10px', borderRadius: '14px', border: '1px solid #fee2e2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b91c1c' }}>
            <AlertTriangle size={13} />
            <span style={{ fontSize: '0.625rem', fontWeight: 700 }}>STOK HABIS</span>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, marginTop: '2px', color: '#b91c1c' }}>{stats.outOfStock}</div>
        </div>

        <div style={{ flex: '0 0 160px', background: 'var(--success-light)', padding: '10px', borderRadius: '14px', border: '1px solid #d1fae5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#047857' }}>
            <DollarSign size={13} />
            <span style={{ fontSize: '0.625rem', fontWeight: 700 }}>ESTIMASI ASET</span>
          </div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 800, marginTop: '4px', color: '#047857' }}>{rp(stats.totalVal)}</div>
        </div>
      </div>

      {/* Search bar */}
      <div className="search-bar" style={{ margin: '0.875rem 1rem 0.625rem 1rem' }}>
        <Search size={18} className="text-secondary" />
        <input
          type="text"
          placeholder="Cari brand, nama barang, SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button style={{ border: 'none', background: 'transparent' }} onClick={() => setSearch('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Kategori chips scrollable */}
      <div className="chip-row" style={{ marginBottom: '0.5rem' }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Status chips scrollable */}
      <div className="chip-row" style={{ marginBottom: '0.75rem' }}>
        {statuses.map(st => (
          <button
            key={st.id}
            className={`chip ${activeStatus === st.id ? 'active' : ''}`}
            onClick={() => setActiveStatus(st.id)}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Search Result Count */}
      <div style={{ padding: '0 1rem 0.5rem 1rem', fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
        MENAMPILKAN {filteredStock.length} ITEM BARANG
      </div>

      {/* Stock Cards List */}
      <div className="card-list" style={{ padding: '0 1rem' }}>
        {isLoading ? (
          <div className="loading-center">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span>Memuat data stok...</span>
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="empty-state card">
            <h3>Stok Tidak Ditemukan</h3>
            <p>Tidak ada item stok yang cocok.</p>
          </div>
        ) : (
          filteredStock.map(item => {
            const isService = item.category === 'service';
            const isLow = !isService && item.stock <= item.min_stock;
            const isEmpty = !isService && item.stock <= 0;

            // Calculate profit margin
            const buyVal = item.modal_price || 0;
            const sellVal = item.sell_price || 0;
            const profit = sellVal - buyVal;
            const margin = sellVal > 0 ? Math.round((profit / sellVal) * 100) : 0;

            // Determine status text & colors
            let statusColor = 'var(--success)';
            let statusBg = 'var(--success-light)';
            let statusText = 'Stok Aman';
            if (isLow) {
              statusColor = 'var(--warning)';
              statusBg = 'var(--warning-light)';
              statusText = 'Stok Menipis';
            }
            if (isEmpty) {
              statusColor = 'var(--danger)';
              statusBg = 'var(--danger-light)';
              statusText = 'Stok Habis';
            }

            return (
              <div
                key={item.id}
                className="card animate-fade-in"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  border: isEmpty
                    ? '1.5px solid var(--danger)'
                    : isLow
                    ? '1.5px solid var(--warning)'
                    : '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  borderRadius: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.5625rem', padding: '2px 8px' }}>
                        {item.category?.toUpperCase()}
                      </span>
                      {!isService && (
                        <span
                          style={{
                            fontSize: '0.5625rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: statusBg,
                            color: statusColor
                          }}
                        >
                          {statusText.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-primary)' }}>
                      {item.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      SKU: <strong style={{ color: 'var(--text-primary)' }}>{item.sku}</strong>
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {rp(item.sell_price)}
                    </div>
                    {!isService && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                          Beli: {rp(item.modal_price || 0)}
                        </span>
                        {margin > 0 && (
                          <span style={{ fontSize: '0.625rem', color: '#047857', fontWeight: 700, background: '#d1fae5', padding: '1px 4px', borderRadius: '4px', marginTop: '2px' }}>
                            Margin: +{margin}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar level for stock */}
                {!isService && (
                  <div style={{ marginTop: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      <span>Level Batas Minimum ({item.min_stock})</span>
                      <span>Stok: {item.stock}</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, (item.stock / (item.min_stock || 1)) * 50)}%`,
                          height: '100%',
                          background: statusColor,
                          borderRadius: '10px'
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="divider" style={{ margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8125rem' }}>
                    Stok Tersedia:{' '}
                    <strong style={{ color: isEmpty ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)', fontSize: '0.9375rem' }}>
                      {isService ? '∞ (Jasa)' : item.stock}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!isService && (
                      <button
                        className="btn btn-secondary btn-sm ripple"
                        style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}
                        onClick={() => setShowAdjustForm(item)}
                      >
                        Adjust
                      </button>
                    )}
                    <button
                      className="btn btn-primary btn-sm ripple"
                      style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}
                      onClick={() => handleOpenEdit(item)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <button className="fab" onClick={() => setShowAddForm(true)} aria-label="Tambah Barang">
        <Plus size={24} />
      </button>

      {/* Add / Edit Item Bottom Sheet */}
      {showAddForm && (
        <>
          <div className="sheet-backdrop" onClick={handleCloseForm} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <span className="sheet-title" style={{ fontWeight: 800 }}>{editingItem ? 'Edit Barang Inventori' : 'Tambah Barang Baru'}</span>
              <button className="sheet-close" onClick={handleCloseForm}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="sheet-body">
                <div className="form-group">
                  <label className="form-label">Kategori Barang *</label>
                  <select className="form-control" value={category} onChange={e => setCategory(e.target.value as any)}>
                    <option value="frame">Frame Kacamata</option>
                    <option value="lens">Lensa</option>
                    <option value="accessory">Aksesoris</option>
                    <option value="service">Jasa Khusus</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Barang *</label>
                  <input type="text" className="form-control" placeholder="Contoh: Frame Oakley Crosslink" value={name} onChange={e => setName(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Kode SKU / Barcode *</label>
                  <input type="text" className="form-control" placeholder="Contoh: OK-CR-BLK" value={sku} onChange={e => setSku(e.target.value)} required />
                </div>

                {category !== 'service' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">Stok Awal</label>
                      <input type="number" className="form-control" value={stock} onChange={e => setStock(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Batas Minimum Stok</label>
                      <input type="number" className="form-control" value={minStock} onChange={e => setMinStock(e.target.value)} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Harga Beli / Modal (Rp) *</label>
                    <input type="number" className="form-control" placeholder="0" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Harga Jual (Rp) *</label>
                    <input type="number" className="form-control" placeholder="0" value={sellPrice} onChange={e => setSellPrice(e.target.value)} required />
                  </div>
                </div>

                {/* Real-time Profit Margin Calculator Box */}
                <div
                  style={{
                    background: formProfit.profit < 0 ? '#fee2e2' : 'var(--success-light)',
                    padding: '12px',
                    borderRadius: '12px',
                    border: formProfit.profit < 0 ? '1px solid var(--danger)' : '1px solid var(--success)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    marginTop: '4px'
                  }}
                >
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PROFIT MARGIN CALCULATOR</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: formProfit.profit < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      Estimasi Untung: {rp(formProfit.profit)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: 'white',
                        background: formProfit.profit < 0 ? 'var(--danger)' : 'var(--success)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {formProfit.margin}% Margin
                    </span>
                  </div>
                </div>

                {editingItem && (
                  <button
                    type="button"
                    className="btn btn-full ripple"
                    style={{
                      marginTop: '0.75rem',
                      height: '44px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1.5px solid #fca5a5',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={handleDeleteItem}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Hapus Barang
                      </>
                    )}
                  </button>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-full ripple"
                  style={{ marginTop: '0.75rem', height: '48px' }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Simpan Data Barang'
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Quick Stock Adjustment Bottom Sheet */}
      {showAdjustForm && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowAdjustForm(null)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <span className="sheet-title">Koreksi Stok (Adjust)</span>
              <button className="sheet-close" onClick={() => setShowAdjustForm(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <div className="sheet-body">
                <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                  Barang: <strong>{showAdjustForm.name}</strong><br />
                  Stok saat ini: <strong>{showAdjustForm.stock}</strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Nilai Penyesuaian (Gunakan minus (-) untuk mengurangi)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Contoh: 10 atau -5"
                    value={adjustmentValue}
                    onChange={e => setAdjustmentValue(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full ripple"
                  style={{ marginTop: '0.75rem', height: '48px' }}
                  disabled={adjustMutation.isPending}
                >
                  {adjustMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Simpan Koreksi Stok'
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
