import { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Power, X, Loader2, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { api } from '../../services/api';

interface Court {
  id: number;
  name: string;
  sport_type: string;
  sport_type_display?: string;
  size: string;
  status: string;
  status_display?: string;
  base_price_per_hour: number;
  peak_hour_price: number;
  tenant?: number;
  image?: string | null;
  opening_time?: string;
  closing_time?: string;
  operating_hours?: { start: string; end: string }[];
}

export function CourtsManagement() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sport_type: '',
    size: '',
    base_price_per_hour: '',
    peak_hour_price: '',
    opening_time: '06:00',
    closing_time: '23:00',
    operating_hours: [{ start: '06:00', end: '23:00' }] as { start: string; end: string }[],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const courtTypes = ['FOOTBALL', 'CRICKET', 'BADMINTON', 'TENNIS', 'BASKETBALL', 'VOLLEYBALL', 'SQUASH', 'OTHER'];
  const courtTypeDisplay = {
    FOOTBALL: 'Football',
    CRICKET: 'Cricket',
    BADMINTON: 'Badminton',
    TENNIS: 'Tennis',
    BASKETBALL: 'Basketball',
    VOLLEYBALL: 'Volleyball',
    SQUASH: 'Squash',
    OTHER: 'Other',
  };

  // Fetch courts from backend
  const fetchCourts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/courts/');
      setCourts(response.data.results || response.data);
    } catch (err: any) {
      console.error('Error fetching courts:', err);
      // Only set error if we don't have courts yet
      if (courts.length === 0) {
        setError('Failed to load courts. Using local data.');
        // Fallback to local data
        setCourts([
          { id: 1, name: 'Court A', sport_type: 'FOOTBALL', size: '100x60 ft', status: 'ACTIVE', base_price_per_hour: 50, peak_hour_price: 80, tenant: 1 },
          { id: 2, name: 'Court B', sport_type: 'CRICKET', size: '120x80 ft', status: 'ACTIVE', base_price_per_hour: 50, peak_hour_price: 80, tenant: 1 },
          { id: 3, name: 'Court C', sport_type: 'FOOTBALL', size: '100x60 ft', status: 'MAINTENANCE', base_price_per_hour: 50, peak_hour_price: 80, tenant: 1 },
          { id: 4, name: 'Court D', sport_type: 'BADMINTON', size: '44x20 ft', status: 'ACTIVE', base_price_per_hour: 40, peak_hour_price: 60, tenant: 1 },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const handleOpenModal = (court?: Court) => {
    if (court) {
      setFormData({
        name: court.name,
        sport_type: court.sport_type,
        size: court.size,
        base_price_per_hour: court.base_price_per_hour.toString(),
        peak_hour_price: court.peak_hour_price?.toString() || '',
        opening_time: court.opening_time ? court.opening_time.substring(0, 5) : '06:00',
        closing_time: court.closing_time ? court.closing_time.substring(0, 5) : '23:00',
        operating_hours: Array.isArray(court.operating_hours) && court.operating_hours.length > 0 
          ? court.operating_hours.map(h => ({ start: h.start.substring(0, 5), end: h.end.substring(0, 5) }))
          : [{ start: court.opening_time?.substring(0, 5) || '06:00', end: court.closing_time?.substring(0, 5) || '23:00' }],
      });
      setEditingId(court.id);
      setImagePreview(court.image || null);
    } else {
      setFormData({ 
        name: '', sport_type: '', size: '', base_price_per_hour: '', peak_hour_price: '', 
        opening_time: '06:00', closing_time: '23:00', 
        operating_hours: [{ start: '06:00', end: '23:00' }] 
      });
      setEditingId(null);
      setImagePreview(null);
    }
    setImageFile(null);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData({ 
      name: '', sport_type: '', size: '', base_price_per_hour: '', peak_hour_price: '', 
      opening_time: '06:00', closing_time: '23:00', 
      operating_hours: [{ start: '06:00', end: '23:00' }] 
    });
    setImageFile(null);
    setImagePreview(null);
    setError(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addShift = () => {
    setFormData(prev => ({
      ...prev,
      operating_hours: [...prev.operating_hours, { start: '16:00', end: '22:00' }]
    }));
  };

  const removeShift = (index: number) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: prev.operating_hours.filter((_, i) => i !== index)
    }));
  };

  const updateShift = (index: number, field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: prev.operating_hours.map((h, i) => i === index ? { ...h, [field]: value } : h)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sport_type || !formData.size || !formData.base_price_per_hour || !formData.peak_hour_price) {
      setError('Please fill in all fields');
      return;
    }

    // Unique name check (case-insensitive, scoped to this tenant's courts)
    const duplicate = courts.find(
      c => c.name.trim().toLowerCase() === formData.name.trim().toLowerCase() && c.id !== editingId
    );
    if (duplicate) {
      setError(`A court named "${formData.name}" already exists. Please choose a different name.`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Use FormData to support multipart image upload
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('sport_type', formData.sport_type);
      payload.append('size', formData.size);
      payload.append('base_price_per_hour', formData.base_price_per_hour);
      payload.append('peak_hour_price', formData.peak_hour_price);
      
      // Use the first shift as the main opening/closing for compatibility
      if (formData.operating_hours.length > 0) {
        payload.append('opening_time', formData.operating_hours[0].start);
        payload.append('closing_time', formData.operating_hours[0].end);
      }
      
      payload.append('operating_hours', JSON.stringify(formData.operating_hours));
      payload.append('status', 'ACTIVE');
      if (imageFile) payload.append('image', imageFile);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editingId) {
        await api.patch(`/courts/${editingId}/`, payload, config);
      } else {
        await api.post('/courts/', payload, config);
      }

      handleCloseModal();
      await fetchCourts();
    } catch (err: any) {
      console.error('Error saving court:', err);
      setError(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to save court');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this court?')) return;

    try {
      setError(null);
      await api.delete(`/courts/${id}/`);
      // Refetch courts to get fresh data
      await fetchCourts();
    } catch (err: any) {
      console.error('Error deleting court:', err);
      setError(err.response?.data?.detail || 'Failed to delete court');
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg md:text-2xl font-semibold text-foreground">Courts & Grounds</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Manage your sports facilities and courts</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            disabled={loading}
            className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors flex items-center gap-2 whitespace-nowrap text-sm md:text-base flex-shrink-0 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add New Court
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#10b981] animate-spin" />
        </div>
      ) : (
        /* Courts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {courts.length === 0 ? (
            <div className="col-span-full bg-card rounded-xl border border-border shadow-sm p-8 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No courts added yet. Click "Add New Court" to get started.</p>
            </div>
          ) : (
            courts.map((court) => (
              <div key={court.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 md:h-40 relative overflow-hidden">
                  {court.image ? (
                    <img
                      src={court.image?.startsWith('http') ? court.image : `http://localhost:8000${court.image}`}
                      alt={court.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center">
                      <Building2 className="w-16 md:w-24 h-16 md:h-24 text-white opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-3 md:top-4 right-3 md:right-4">
                    {court.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted text-[#10b981] rounded-full text-xs font-medium">
                        <Power className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted text-[#f59e0b] rounded-full text-xs font-medium">
                        <Power className="w-3 h-3" />
                        {court.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-xl font-semibold text-foreground mb-1 truncate">{court.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{courtTypeDisplay[court.sport_type as keyof typeof courtTypeDisplay] || court.sport_type}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenModal(court)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-[#3b82f6]" />
                      </button>
                      <button
                        onClick={() => handleDelete(court.id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-[#ef4444]" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-xs md:text-sm text-muted-foreground">Size:</span>
                      <span className="text-xs md:text-sm font-medium text-foreground">{court.size}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-xs md:text-sm text-muted-foreground">Regular Rate:</span>
                      <span className="text-xs md:text-sm font-medium text-foreground">₹{court.base_price_per_hour}/hr</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-xs md:text-sm text-muted-foreground">Peak Hour Rate:</span>
                      <span className="text-xs md:text-sm font-medium text-[#10b981]">₹{court.peak_hour_price}/hr</span>
                    </div>
                    <div className="flex flex-col gap-2 py-2 border-b border-border">
                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Operating Shifts:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(court.operating_hours) && court.operating_hours.length > 0 ? (
                          court.operating_hours.map((shift, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-muted rounded text-[10px] md:text-xs font-medium text-foreground border border-border">
                              {shift.start.substring(0, 5)} - {shift.end.substring(0, 5)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-medium text-foreground">
                            {court.opening_time?.substring(0, 5)} - {court.closing_time?.substring(0, 5)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm md:text-base min-h-[44px]">
                    View Schedule
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Court Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-2 md:p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg my-auto relative">
            {/* Modal Header */}
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 md:p-6 border-b border-border bg-card">
              <h3 className="text-lg md:text-xl font-semibold text-foreground">
                {editingId ? 'Edit Court' : 'Add New Court'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
 
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
              {/* Court Name */}
              <div className="space-y-2">
                <label className="block text-sm md:text-base font-medium text-foreground">
                  Court Name
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Court A"
                  className={`w-full ${
                    formData.name &&
                    courts.some(c => c.name.trim().toLowerCase() === formData.name.trim().toLowerCase() && c.id !== editingId)
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }`}
                />
                {formData.name &&
                  courts.some(c => c.name.trim().toLowerCase() === formData.name.trim().toLowerCase() && c.id !== editingId) && (
                  <p className="text-xs text-red-500 mt-1">⚠ A court with this name already exists.</p>
                )}
              </div>

              {/* Court Type */}
              <div className="space-y-2">
                <label className="block text-sm md:text-base font-medium text-foreground">
                  Court Type
                </label>
                <select
                  name="sport_type"
                  value={formData.sport_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 md:py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#10b981] min-h-[44px]"
                >
                  <option value="">Select court type</option>
                  {courtTypes.map(type => (
                    <option key={type} value={type}>{courtTypeDisplay[type as keyof typeof courtTypeDisplay]}</option>
                  ))}
                </select>
              </div>

              {/* Court Size */}
              <div className="space-y-2">
                <label className="block text-sm md:text-base font-medium text-foreground">
                  Court Size
                </label>
                <Input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  placeholder="e.g., 100x60 ft"
                  className="w-full"
                />
              </div>

              {/* Regular Hourly Rate */}
              <div className="space-y-2">
                <label className="block text-sm md:text-base font-medium text-foreground">
                  Regular Hourly Rate (₹)
                </label>
                <Input
                  type="number"
                  name="base_price_per_hour"
                  value={formData.base_price_per_hour}
                  onChange={handleInputChange}
                  placeholder="e.g., 50"
                  min="0"
                  step="0.01"
                  className="w-full"
                />
              </div>

              {/* Peak Hour Rate */}
              <div className="space-y-2">
                <label className="block text-sm md:text-base font-medium text-foreground">
                  Peak Hour Rate (₹)
                </label>
                <Input
                  type="number"
                  name="peak_hour_price"
                  value={formData.peak_hour_price}
                  onChange={handleInputChange}
                  placeholder="e.g., 80"
                  min="0"
                  step="0.01"
                  className="w-full"
                />
              </div>

              {/* Dynamic Operating Shifts */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm md:text-base font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Operating Shifts
                  </label>
                  <button
                    type="button"
                    onClick={addShift}
                    className="text-xs font-medium text-[#10b981] hover:text-[#059669] flex items-center gap-1 bg-[#10b981]/10 px-2 py-1 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Shift
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.operating_hours.map((shift, index) => (
                    <div key={index} className="group relative grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl border border-border hover:border-[#10b981]/30 transition-all">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Opening
                        </label>
                        <Input
                          type="time"
                          value={shift.start}
                          onChange={(e) => updateShift(index, 'start', e.target.value)}
                          className="w-full bg-card h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Closing
                        </label>
                        <Input
                          type="time"
                          value={shift.end}
                          onChange={(e) => updateShift(index, 'end', e.target.value)}
                          className="w-full bg-card h-9"
                        />
                      </div>
                      {formData.operating_hours.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeShift(index)}
                          className="absolute -right-2 -top-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {formData.operating_hours.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed border-border rounded-xl">
                    No shifts added. Click "Add Shift" to define timings.
                  </p>
                )}
              </div>

              {/* Court Photo Upload */}
              <div className="space-y-2">
                <label className="block text-sm md:text-base font-medium text-foreground">
                  Court Photo <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <label
                  htmlFor="court-image-upload"
                  className="flex flex-col items-center justify-center w-full border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-[#10b981] transition-colors overflow-hidden"
                  style={{ minHeight: '120px' }}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Court preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                      <svg className="w-8 h-8 mb-2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs">Click to upload court photo</p>
                      <p className="text-xs mt-1">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  )}
                </label>
                <input
                  id="court-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    ✕ Remove photo
                  </button>
                )}
              </div>

              {/* Modal Footer - Buttons */}
              <div className="flex gap-3 pt-4 md:pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 md:py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-sm md:text-base min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 md:py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors text-sm md:text-base min-h-[44px] font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Update Court' : 'Add Court'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}