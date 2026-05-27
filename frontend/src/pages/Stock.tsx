import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '../services/api';
import type { StockItem } from 'optik88-shared';
import { Search, Plus, Filter, Edit3, ArrowUpRight, ShieldAlert, Loader2, Trash2 } from 'lucide-react';
import './Stock.css';

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const Stock: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'frame' | 'lens' | 'service'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Modals / Form triggers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<StockItem | null>(null);

  // Add Item Fields
  const [newItem, setNewItem] = useState({
    category: 'frame' as 'frame' | 'lens' | 'service',
    brand: '',
    name: '',
    sku: '',
    color: '',
    modal_price: 0,
    sell_price: 0,
    stock: 0,
    min_stock: 5,
    supplier: '',
    description: ''
  });

  // Edit Item Fields
  const [editItem, setEditItem] = useState<StockItem | null>(null);

  // Adjust Stock Fields
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'in' | 'correction'>('in');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Queries & Mutations
  const { data: stockList = [], isLoading, isError } = useQuery<StockItem[]>({
    queryKey: ['stock'],
    queryFn: stockService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: stockService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setIsAddOpen(false);
      // Reset
      setNewItem({
        category: 'frame',
        brand: '',
        name: '',
        sku: '',
        color: '',
        modal_price: 0,
        sell_price: 0,
        stock: 0,
        min_stock: 5,
        supplier: '',
        description: ''
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StockItem> }) => stockService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setIsEditOpen(false);
      setEditItem(null);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, adjustment }: { id: string; adjustment: number }) => stockService.adjust(id, adjustment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setIsAdjustOpen(false);
      setSelectedItemForAdjust(null);
      setAdjustQty(1);
      setAdjustNotes('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stockService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setIsEditOpen(false);
      setEditItem(null);
    },
  });

  const handleDeleteItem = (item: StockItem) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus barang "${item.brand} - ${item.name}" dari katalog?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const filteredItems = stockList.filter(item => {
    const matchesSearch = (item.name + ' ' + item.brand + ' ' + (item.sku || '')).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' ? true : item.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'low') {
      matchesStatus = item.category !== 'service' && item.stock > 0 && item.stock <= item.min_stock;
    } else if (statusFilter === 'out') {
      matchesStatus = item.category !== 'service' && item.stock === 0;
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.brand.trim() || !newItem.name.trim()) return;

    await createMutation.mutateAsync({
      ...newItem,
      stock: newItem.category === 'service' ? 999 : newItem.stock,
    });
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    await updateMutation.mutateAsync({
      id: editItem.id,
      data: {
        category: editItem.category,
        brand: editItem.brand.trim(),
        name: editItem.name.trim(),
        sku: editItem.sku || undefined,
        color: editItem.color || undefined,
        modal_price: editItem.modal_price,
        sell_price: editItem.sell_price,
        min_stock: editItem.min_stock,
        supplier: editItem.supplier || undefined,
        description: editItem.description || undefined
      }
    });
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;

    const adjustment = adjustType === 'in'
      ? adjustQty
      : adjustQty - selectedItemForAdjust.stock;

    await adjustMutation.mutateAsync({
      id: selectedItemForAdjust.id,
      adjustment
    });
  };

  return (
    <div className="stock-page animate-fade-in">
      <div className="page-header-wizard">
        <div className="header-titles">
          <h1>Kelola Stok & Inventaris</h1>
          <p>Kelola frame kacamata, brand lensa (termasuk lensa gosokan kustom), serta penyesuaian stok masuk dan harga jual.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary btn-add-item shadow-glow" onClick={() => setIsAddOpen(true)}>
            <Plus size={18} /> TAMBAH BARANG BARU
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="stock-filter-card">
        <div className="search-box-wrap flex-1">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="form-control search-input" 
            placeholder="Cari SKU, brand, nama frame/lensa..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="filter-item">
            <Filter size={16} className="text-secondary" />
            <select 
              className="form-control select-clean"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as 'all' | 'frame' | 'lens' | 'service')}
            >
              <option value="all">Semua Kategori</option>
              <option value="frame">Frame Kacamata</option>
              <option value="lens">Lensa Kustom (Lab / Gosokan)</option>
              <option value="service">Jasa Pengerjaan</option>
            </select>
          </div>

          <div className="filter-item">
            <ShieldAlert size={16} className="text-secondary" />
            <select 
              className="form-control select-clean"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'low' | 'out')}
            >
              <option value="all">Semua Status Stok</option>
              <option value="low">Stok Menipis</option>
              <option value="out">Stok Habis / Kosong</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="stock-table-card">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px] flex-col gap-2">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-gray-500">Memuat katalog inventaris...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-5 text-danger">
            Gagal memuat katalog inventaris dari database server.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th>Brand & Nama Item</th>
                  <th>SKU / Detail</th>
                  <th className="text-right">Harga Modal</th>
                  <th className="text-right">Harga Jual</th>
                  <th className="text-center">Jumlah Stok</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const isLow = item.category !== 'service' && item.stock > 0 && item.stock <= item.min_stock;
                  const isOut = item.category !== 'service' && item.stock === 0;
                  
                  return (
                    <tr key={item.id} className={`${isOut ? 'tr-out-stock' : ''} ${isLow ? 'tr-low-stock' : ''}`}>
                      <td>
                        <span className={`cat-tag tag-${item.category}`}>
                          {item.category.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="item-name-cell">
                          <strong>{item.brand}</strong> {item.name}
                          {item.description && <span className="item-desc-sub">{item.description}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="item-sku-cell">
                          <span className="sku-badge font-mono">{item.sku || 'N/A'}</span>
                          {item.color && <span className="color-sub">Warna: {item.color}</span>}
                        </div>
                      </td>
                      <td className="text-right">
                        <span className="price-modal">{rp(item.modal_price)}</span>
                      </td>
                      <td className="text-right">
                        <span className="price-sell font-bold text-primary">{rp(item.sell_price)}</span>
                      </td>
                      <td className="text-center">
                        {item.category === 'service' ? (
                          <span className="infinite-stock">∞ <small className="text-tertiary">Jasa</small></span>
                        ) : (
                          <div className="stock-count-wrap">
                            <span className={`stock-number font-bold ${isOut ? 'text-danger font-black' : isLow ? 'text-warning' : 'text-success'}`}>
                              {item.stock} pcs
                            </span>
                            {isOut && <span className="stock-warning-badge text-danger">KOSONG</span>}
                            {isLow && <span className="stock-warning-badge text-warning">MENIPIS</span>}
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="actions-cell-row">
                          <button 
                            className="btn-table-action" 
                            onClick={() => { setEditItem({ ...item }); setIsEditOpen(true); }} 
                            title="Edit Detail Barang"
                          >
                            <Edit3 size={16} />
                          </button>
                          
                          {item.category !== 'service' && (
                            <button 
                              className="btn-table-action text-secondary" 
                              onClick={() => { setSelectedItemForAdjust(item); setIsAdjustOpen(true); }}
                              title="Tambah/Koreksi Stok"
                            >
                              <ArrowUpRight size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-secondary">
                      Tidak ada barang inventori yang cocok dengan kriteria pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: TAMBAH BARANG BARU */}
      {isAddOpen && (
        <div className="modal-backdrop">
          <div className="modal-content-card animate-scale-in">
            <div className="modal-header">
              <h3>Tambah Barang Baru ke Inventaris</h3>
              <button className="close-btn" onClick={() => setIsAddOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddItem}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="form-label">Kategori Barang *</label>
                  <select 
                    className="form-control" 
                    value={newItem.category} 
                    onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value as 'frame' | 'lens' | 'service' }))}
                  >
                    <option value="frame">Frame Kacamata</option>
                    <option value="lens">Lensa Kustom (Lab / Gosokan)</option>
                    <option value="service">Jasa Pengerjaan</option>
                  </select>
                </div>

                <div className="field-row">
                  <div className="field-group">
                    <label className="form-label">Brand / Merk *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Contoh: Ray-Ban, Hoya"
                      value={newItem.brand}
                      onChange={e => setNewItem(prev => ({ ...prev, brand: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label className="form-label">Nama Item *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Contoh: RB5154 Clubmaster, Lensa Gosok Essilor"
                      value={newItem.name}
                      onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-group">
                    <label className="form-label">SKU / Kode Unik</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Contoh: RB5154-BK"
                      value={newItem.sku}
                      onChange={e => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
                    />
                  </div>
                  <div className="field-group">
                    <label className="form-label">Warna (Khusus Frame)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Contoh: Glossy Black, Gold"
                      value={newItem.color}
                      onChange={e => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                      disabled={newItem.category !== 'frame'}
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-group">
                    <label className="form-label">Harga Modal (Rp) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="0"
                      value={newItem.modal_price || ''}
                      onChange={e => setNewItem(prev => ({ ...prev, modal_price: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label className="form-label">Harga Jual (Rp) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="0"
                      value={newItem.sell_price || ''}
                      onChange={e => setNewItem(prev => ({ ...prev, sell_price: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                {newItem.category !== 'service' && (
                  <div className="field-row">
                    <div className="field-group">
                      <label className="form-label">Jumlah Stok Awal *</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="0"
                        value={newItem.stock || ''}
                        onChange={e => setNewItem(prev => ({ ...prev, stock: Number(e.target.value) }))}
                        required
                      />
                    </div>
                    <div className="field-group">
                      <label className="form-label">Batas Stok Minimum *</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="5"
                        value={newItem.min_stock || ''}
                        onChange={e => setNewItem(prev => ({ ...prev, min_stock: Number(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="field-group">
                  <label className="form-label">Supplier / Distributor</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nama supplier pengirim barang"
                    value={newItem.supplier}
                    onChange={e => setNewItem(prev => ({ ...prev, supplier: e.target.value }))}
                  />
                </div>

                <div className="field-group">
                  <label className="form-label">Deskripsi / Spesifikasi Lensa</label>
                  <textarea 
                    className="form-control" 
                    rows={2} 
                    placeholder="Contoh: Index 1.56, Anti-Reflective Coating, Photochromic..."
                    value={newItem.description}
                    onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>BATAL</button>
                <button type="submit" className="btn btn-primary shadow-glow" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'MENYIMPAN...' : 'DAFTARKAN BARANG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT DETAIL BARANG */}
      {isEditOpen && editItem && (
        <div className="modal-backdrop">
          <div className="modal-content-card animate-scale-in">
            <div className="modal-header">
              <h3>Ubah Detail Barang</h3>
              <button className="close-btn" onClick={() => { setIsEditOpen(false); setEditItem(null); }}>×</button>
            </div>
            <form onSubmit={handleEditItem}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="form-label">Kategori Barang *</label>
                  <select 
                    className="form-control" 
                    value={editItem.category} 
                    onChange={e => setEditItem(prev => prev ? ({ ...prev, category: e.target.value as 'frame' | 'lens' | 'service' }) : null)}
                  >
                    <option value="frame">Frame Kacamata</option>
                    <option value="lens">Lensa Kustom (Lab / Gosokan)</option>
                    <option value="service">Jasa Pengerjaan</option>
                  </select>
                </div>

                <div className="field-row">
                  <div className="field-group">
                    <label className="form-label">Brand / Merk *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editItem.brand}
                      onChange={e => setEditItem(prev => prev ? ({ ...prev, brand: e.target.value }) : null)}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label className="form-label">Nama Item *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editItem.name}
                      onChange={e => setEditItem(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                      required
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-group">
                    <label className="form-label">SKU / Kode Unik</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editItem.sku || ''}
                      onChange={e => setEditItem(prev => prev ? ({ ...prev, sku: e.target.value }) : null)}
                    />
                  </div>
                  <div className="field-group">
                    <label className="form-label">Warna (Khusus Frame)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editItem.color || ''}
                      onChange={e => setEditItem(prev => prev ? ({ ...prev, color: e.target.value }) : null)}
                      disabled={editItem.category !== 'frame'}
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-group">
                    <label className="form-label">Harga Modal (Rp) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editItem.modal_price}
                      onChange={e => setEditItem(prev => prev ? ({ ...prev, modal_price: Number(e.target.value) }) : null)}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label className="form-label">Harga Jual (Rp) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editItem.sell_price}
                      onChange={e => setEditItem(prev => prev ? ({ ...prev, sell_price: Number(e.target.value) }) : null)}
                      required
                    />
                  </div>
                </div>

                {editItem.category !== 'service' && (
                  <div className="field-row">
                    <div className="field-group">
                      <label className="form-label">Batas Stok Minimum *</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={editItem.min_stock}
                        onChange={e => setEditItem(prev => prev ? ({ ...prev, min_stock: Number(e.target.value) }) : null)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="field-group">
                  <label className="form-label">Supplier / Distributor</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editItem.supplier || ''}
                    onChange={e => setEditItem(prev => prev ? ({ ...prev, supplier: e.target.value }) : null)}
                  />
                </div>

                <div className="field-group">
                  <label className="form-label">Deskripsi / Spesifikasi Lensa</label>
                  <textarea 
                    className="form-control" 
                    rows={2} 
                    value={editItem.description || ''}
                    onChange={e => setEditItem(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '0.625rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => editItem && handleDeleteItem(editItem)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={16} />
                  {deleteMutation.isPending ? 'MENGHAPUS...' : 'HAPUS BARANG'}
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsEditOpen(false); setEditItem(null); }}>BATAL</button>
                  <button type="submit" className="btn btn-primary shadow-glow" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INPUT STOK MASUK / KOREKSI FISIK */}
      {isAdjustOpen && selectedItemForAdjust && (
        <div className="modal-backdrop">
          <div className="modal-content-card animate-scale-in">
            <div className="modal-header">
              <h3>Tambah & Koreksi Stok</h3>
              <button className="close-btn" onClick={() => { setIsAdjustOpen(false); setSelectedItemForAdjust(null); }}>×</button>
            </div>
            <form onSubmit={handleAdjustStock}>
              <div className="modal-body">
                <div className="adjust-item-header">
                  <span className={`cat-tag tag-${selectedItemForAdjust.category}`}>{selectedItemForAdjust.category.toUpperCase()}</span>
                  <h4>{selectedItemForAdjust.brand} - {selectedItemForAdjust.name}</h4>
                  <p>Stok tercatat sistem: <strong>{selectedItemForAdjust.stock} pcs</strong></p>
                </div>

                <div className="field-group mt-3">
                  <label className="form-label font-bold">Jenis Penyesuaian *</label>
                  <div className="source-segmented-control">
                    <button
                      type="button"
                      className={`seg-btn ${adjustType === 'in' ? 'active-internal' : ''}`}
                      onClick={() => { setAdjustType('in'); setAdjustQty(1); }}
                    >
                      📈 Masuk (Tambah Stok)
                    </button>
                    <button
                      type="button"
                      className={`seg-btn ${adjustType === 'correction' ? 'active-external' : ''}`}
                      onClick={() => { setAdjustType('correction'); setAdjustQty(selectedItemForAdjust.stock); }}
                    >
                      ⚙️ Koreksi Fisik (Opname)
                    </button>
                  </div>
                </div>

                <div className="field-group mt-3">
                  <label className="form-label">
                    {adjustType === 'in' ? 'Jumlah Tambah Stok (pcs) *' : 'Jumlah Sebenarnya Hasil Opname (pcs) *'}
                  </label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={adjustQty} 
                    onChange={e => setAdjustQty(Number(e.target.value))}
                    min={adjustType === 'in' ? 1 : 0}
                    required
                  />
                </div>

                <div className="field-group mt-3">
                  <label className="form-label">Alasan / Catatan Penyesuaian</label>
                  <textarea 
                    className="form-control" 
                    rows={2} 
                    placeholder="Contoh: Pengiriman barang masuk dari Supplier / Koreksi karena barang hilang..."
                    value={adjustNotes}
                    onChange={e => setAdjustNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setIsAdjustOpen(false); setSelectedItemForAdjust(null); }}>BATAL</button>
                <button type="submit" className="btn btn-primary shadow-glow" disabled={adjustMutation.isPending}>
                  {adjustMutation.isPending ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
