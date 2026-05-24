import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, DollarSign, CheckCircle, Users, ChevronLeft, Loader2 } from 'lucide-react';
import { api, extractApiError } from '../../services/api';
import { toast } from 'sonner';

interface Court {
  id: number;
  name: string;
  sport_type_display: string;
  size: string;
  status: string;
  base_price_per_hour?: string;
  peak_hour_price?: string;
  opening_time?: string;
  closing_time?: string;
  operating_hours?: { start: string; end: string }[];
}

interface Slot {
  id: number;
  time: string;
  price: string;
  available: boolean;
}

export function WalkInBooking() {
  const [step, setStep] = useState(1);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [paymentMode, setPaymentMode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch courts from backend
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/courts/');
        const courtList = response.data.results || response.data;
        setCourts(courtList.filter((c: any) => c.status === 'ACTIVE'));
        if (courtList.length > 0) {
          setSelectedCourt(courtList[0].id);
        }
      } catch (err) {
        toast.error(extractApiError(err));
      } finally {
        setLoading(false);
      }
    };
    fetchCourts();
  }, []);

  // Fetch booked slots for selected court and date
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedCourt || !selectedDate) return;

      try {
        const response = await api.get('/bookings/', {
          params: { date: selectedDate, court: selectedCourt }
        });
        
        const bookings = response.data.results || response.data;
        const booked: string[] = [];

        // Extract booked time slots
        bookings.forEach((booking: any) => {
          const startTime = new Date(booking.start_time);
          const startHour = String(startTime.getHours()).padStart(2, '0');
          const startMin = String(startTime.getMinutes()).padStart(2, '0');
          const timeKey = `${startHour}:${startMin}`;
          booked.push(timeKey);
        });

        setBookedSlots(booked);

        const courtInfo = courts.find(c => c.id === selectedCourt);
        if (!courtInfo) return;

        const generatedSlots = [];
        let slotId = 1;

        const addSlotsForRange = (openStr: string, closeStr: string) => {
          const openHour = parseInt(openStr.split(':')[0], 10);
          const closeHour = parseInt(closeStr.split(':')[0], 10);
          
          for (let hour = openHour; hour < closeHour; hour++) {
            const startHourStr = hour.toString().padStart(2, '0');
            const endHourStr = (hour + 1).toString().padStart(2, '0');
            const slotTimeStr = `${startHourStr}:00`;
            
            let dynamicPrice = '0';
            if (hour >= 17 && courtInfo.peak_hour_price) {
               dynamicPrice = parseFloat(courtInfo.peak_hour_price).toString();
            } else if (courtInfo.base_price_per_hour) {
               dynamicPrice = parseFloat(courtInfo.base_price_per_hour).toString();
            }

            const isBooked = booked.includes(slotTimeStr);

            generatedSlots.push({
              id: slotId++,
              time: `${startHourStr}:00 - ${endHourStr}:00`,
              price: dynamicPrice,
              available: !isBooked
            });
          }
        };

        if (Array.isArray(courtInfo.operating_hours) && courtInfo.operating_hours.length > 0) {
          courtInfo.operating_hours.forEach(shift => {
            if (shift.start && shift.end) {
              addSlotsForRange(shift.start, shift.end);
            }
          });
        } else if (courtInfo.opening_time && courtInfo.closing_time) {
          addSlotsForRange(courtInfo.opening_time, courtInfo.closing_time);
        } else {
          addSlotsForRange('06:00', '23:00'); // fallback
        }

        setAvailableSlots(generatedSlots);
        
        // Remove selected slots that are no longer available
        setSelectedSlots(prev => prev.filter(id => generatedSlots.find(s => s.id === id)?.available));
      } catch (err) {
        console.error('Error fetching booked slots:', err);
      }
    };

    fetchBookedSlots();
  }, [selectedCourt, selectedDate, refreshTrigger]);

  const handleConfirmBooking = async () => {
    if (!selectedCourt || selectedSlots.length === 0 || !customerName || !customerPhone) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Create bookings for each selected slot
      const validSlots = selectedSlots
        .map(id => availableSlots.find(s => s.id === id))
        .filter((s): s is Slot => !!s);

      const bookingPromises = validSlots.map(async (slot) => {
        // Parse start and end times safely
        const timeParts = slot.time.split(' - ');
        if (timeParts.length !== 2) return;

        const [startPart, endPart] = timeParts;
        const [startHour, startMin] = startPart.split(':').map(n => parseInt(n, 10));
        const [endHour, endMin] = endPart.split(':').map(n => parseInt(n, 10));

        if (isNaN(startHour) || isNaN(endHour)) return;

        const startDateTime = new Date(`${selectedDate}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`);
        const endDateTime = new Date(`${selectedDate}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`);

        const bookingData = {
          court: selectedCourt,
          customer_name: customerName,
          customer_phone: customerPhone,
          date: selectedDate,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          total_price: parseFloat(slot.price),
          payment_status: 'PENDING',
          payment_method: (paymentMode || 'CASH').toUpperCase(),
          status: 'CONFIRMED',
        };

        return api.post('/bookings/', bookingData);
      });

      await Promise.all(bookingPromises);

      // Success — reset form
      setStep(1);
      setSelectedCourt(courts.length > 0 ? courts[0].id : null);
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setSelectedSlots([]);
      setPaymentMode('');
      setCustomerName('');
      setCustomerPhone('');
      setRefreshTrigger(prev => prev + 1);

      toast.success('Booking confirmed successfully!');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSlotsData = availableSlots.filter(s => selectedSlots.includes(s.id));
  const totalPrice = selectedSlotsData.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
  const selectedCourtData = courts.find(c => c.id === selectedCourt);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Steps */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6 mb-6">
        <div className="flex items-center justify-between gap-1 md:gap-2 overflow-x-auto">
          {[
            { num: 1, label: 'Customer Info', icon: Users },
            { num: 2, label: 'Court & Slot', icon: CalendarIcon },
            { num: 3, label: 'Payment', icon: DollarSign },
            { num: 4, label: 'Confirm', icon: CheckCircle },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.num} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 md:w-12 h-10 md:h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                    ${step >= item.num ? 'bg-[#10b981] text-white' : 'bg-muted text-muted-foreground'}
                  `}>
                    <Icon className="w-5 md:w-6 h-5 md:h-6" />
                  </div>
                  <p className={`text-xs md:text-sm mt-2 text-center whitespace-nowrap ${step >= item.num ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {item.label}
                  </p>
                </div>
                {index < 3 && (
                  <div className={`w-8 md:w-16 h-1 mx-1 md:mx-2 flex-shrink-0 ${step > item.num ? 'bg-[#10b981]' : 'bg-muted'}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-8">
        {/* Step 1: Customer Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-xs md:text-sm font-medium text-foreground mb-2">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-3 md:px-4 py-2 md:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-foreground mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-3 md:px-4 py-2 md:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => customerName && customerPhone && setStep(2)}
              disabled={!customerName || !customerPhone}
              className="w-full py-2 md:py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              Continue to Court & Slot Selection
            </button>
          </div>
        )}

        {/* Step 2: Court & Time Slot (Merged) */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-xs md:text-sm text-[#10b981] font-semibold">Step 2 of 3</p>
                <h2 className="text-lg md:text-2xl font-semibold text-foreground mt-1">Select Court & Time</h2>
              </div>
              <button onClick={() => setStep(1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            {/* Court Selection */}
            <div className="space-y-3">
              <h3 className="text-base md:text-lg font-semibold text-foreground">Available Courts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {courts.map((court) => (
                  <button
                    key={court.id}
                    onClick={() => court.status === 'ACTIVE' && setSelectedCourt(court.id)}
                    disabled={court.status !== 'ACTIVE'}
                    className={`
                      p-4 md:p-6 rounded-lg border-2 text-left transition-all
                      ${selectedCourt === court.id
                        ? 'border-[#10b981] bg-muted'
                        : court.status === 'ACTIVE'
                          ? 'border-border hover:border-[#10b981] bg-card'
                          : 'border-border opacity-50 cursor-not-allowed bg-card'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-foreground mb-1 text-sm md:text-base">{court.name}</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">{court.sport_type_display}</p>
                      </div>
                      {selectedCourt === court.id && (
                        <CheckCircle className="w-4 md:w-5 h-4 md:h-5 text-[#10b981] flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-foreground">Select Date & Time</h3>

              {/* Date Picker */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-foreground mb-2">Booking Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 md:px-4 py-2 md:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              {/* Selected Date Info */}
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Selected Date</p>
                <p className="text-lg md:text-xl font-semibold text-[#10b981]">
                  {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Available slots for {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                </p>
              </div>

              {/* Time Slots Grid */}
              <div>
                <p className="text-xs md:text-sm font-semibold text-foreground mb-3">Available Slots</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => {
                        if (slot.available) {
                          setSelectedSlots(prev => 
                            prev.includes(slot.id) 
                              ? prev.filter(id => id !== slot.id) 
                              : [...prev, slot.id]
                          );
                        }
                      }}
                      disabled={!slot.available}
                      className={`
                        p-3 md:p-4 rounded-lg border-2 text-center transition-all relative
                        ${selectedSlots.includes(slot.id)
                          ? 'border-[#10b981] bg-muted text-foreground'
                          : slot.available
                            ? 'border-border hover:border-[#10b981] bg-card text-foreground'
                            : 'border-border opacity-50 cursor-not-allowed bg-card text-muted-foreground'
                        }
                      `}
                    >
                      {selectedSlots.includes(slot.id) && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle className="w-3 h-3 text-[#10b981]" />
                        </div>
                      )}
                      <Clock className="w-3 md:w-4 h-3 md:h-4 mx-auto mb-1 md:mb-2 text-emerald-400" />
                      <p className="font-medium text-xs md:text-sm">{slot.time}</p>
                      <p className={`text-xs font-semibold mt-1 ${selectedSlots.includes(slot.id) || slot.available ? 'text-[#10b981]' : ''}`}>
                        ₹{slot.price}
                      </p>
                      {!slot.available && <p className="text-xs text-muted-foreground mt-1">Booked</p>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2 md:py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm md:text-base"
              >
                Back
              </button>
              <button
                onClick={() => selectedCourt && selectedDate && selectedSlots.length > 0 && setStep(3)}
                disabled={!selectedCourt || !selectedDate || selectedSlots.length === 0}
                className="flex-1 py-2 md:py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg md:text-2xl font-semibold text-foreground">Payment Method</h2>
            <div className="bg-muted p-4 md:p-6 rounded-lg">
              <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-2 mb-2">
                <span className="text-foreground text-sm md:text-base">Booking Amount:</span>
                <span className="text-xl md:text-2xl font-semibold text-foreground">₹{totalPrice}</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">{selectedSlots.length} slot(s) selected</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-2">Court: {selectedCourtData?.name}</p>
            </div>
            <div className="space-y-2 md:space-y-3">
              {['Cash', 'Card', 'UPI', 'Online'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`
                    w-full p-3 md:p-4 rounded-lg border-2 text-left transition-all text-sm md:text-base
                    ${paymentMode === mode
                      ? 'border-[#10b981] bg-muted'
                      : 'border-border hover:border-[#10b981] bg-card'
                    }
                  `}
                >
                  <p className="font-medium text-foreground">{mode}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-2 md:py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm md:text-base"
              >
                Back
              </button>
              <button
                onClick={() => paymentMode && setStep(4)}
                disabled={!paymentMode}
                className="flex-1 py-2 md:py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                Review Booking
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-14 md:w-16 h-14 md:h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 md:w-10 h-8 md:h-10 text-[#10b981]" />
              </div>
              <h2 className="text-lg md:text-2xl font-semibold text-foreground">Review Booking</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-2">Please confirm the booking details</p>
            </div>

            <div className="bg-muted rounded-lg p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex flex-col md:flex-row md:justify-between gap-2">
                <span className="text-xs md:text-sm text-muted-foreground">Customer Name:</span>
                <span className="font-medium text-foreground text-sm">{customerName}</span>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between gap-2">
                <span className="text-xs md:text-sm text-muted-foreground">Phone:</span>
                <span className="font-medium text-foreground text-sm">{customerPhone}</span>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between gap-2">
                <span className="text-xs md:text-sm text-muted-foreground">Court:</span>
                <span className="font-medium text-foreground text-sm">{selectedCourtData?.name}</span>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between gap-2">
                <span className="text-xs md:text-sm text-muted-foreground">Date:</span>
                <span className="font-medium text-foreground text-sm">
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between gap-2">
                <span className="text-xs md:text-sm text-muted-foreground">Time:</span>
                <div className="flex flex-col items-end">
                  {selectedSlotsData.map(s => (
                    <span key={s.id} className="font-medium text-foreground text-sm">{s.time} (₹{s.price})</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between gap-2">
                <span className="text-xs md:text-sm text-muted-foreground">Payment Method:</span>
                <span className="font-medium text-foreground text-sm">{paymentMode}</span>
              </div>
              <div className="border-t border-border pt-3 md:pt-4 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-2">
                <span className="font-semibold text-foreground text-sm md:text-base">Total Amount:</span>
                <span className="text-lg md:text-2xl font-semibold text-[#10b981]">₹{totalPrice}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-2 md:py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm md:text-base"
              >
                Back
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={submitting}
                className="flex-1 py-2 md:py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base font-medium flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
