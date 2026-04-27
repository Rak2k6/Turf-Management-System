import { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';

export function CustomerBooking() {
  const [step, setStep] = useState(1);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');

  const courts = [
    { id: 'court-a', name: 'Court A', type: 'Football', price: 50 },
    { id: 'court-b', name: 'Court B', type: 'Cricket', price: 50 },
    { id: 'court-c', name: 'Court C', type: 'Football', price: 50 },
    { id: 'court-d', name: 'Court D', type: 'Badminton', price: 40 },
  ];

  const timeSlots = [
    { id: 'slot-1', time: '09:00 AM - 10:00 AM', price: 50, available: true },
    { id: 'slot-2', time: '10:00 AM - 11:00 AM', price: 50, available: true },
    { id: 'slot-3', time: '11:00 AM - 12:00 PM', price: 50, available: false },
    { id: 'slot-4', time: '02:00 PM - 03:00 PM', price: 60, available: true },
    { id: 'slot-5', time: '03:00 PM - 04:00 PM', price: 60, available: true },
    { id: 'slot-6', time: '04:00 PM - 05:00 PM', price: 60, available: true },
    { id: 'slot-7', time: '05:00 PM - 06:00 PM', price: 80, available: true },
    { id: 'slot-8', time: '06:00 PM - 07:00 PM', price: 80, available: true },
  ];

  const selectedCourtData = courts.find(c => c.id === selectedCourt);
  const selectedSlotData = timeSlots.find(s => s.id === selectedSlot);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center">
                <span className="text-xl font-bold text-white">GV</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Green Valley Sports</h2>
                <p className="text-xs text-muted-foreground">Book Your Court</p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Select Court' },
              { num: 2, label: 'Choose Date' },
              { num: 3, label: 'Pick Time Slot' },
              { num: 4, label: 'Confirm Booking' },
            ].map((item, index) => (
              <div key={item.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-colors mb-2
                    ${step >= item.num ? 'bg-[#10b981] text-white' : 'bg-muted text-muted-foreground'}
                  `}>
                    {step > item.num ? <CheckCircle className="w-5 h-5" /> : item.num}
                  </div>
                  <p className={`text-sm ${step >= item.num ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {item.label}
                  </p>
                </div>
                {index < 3 && (
                  <div className={`h-0.5 flex-1 ${step > item.num ? 'bg-[#10b981]' : 'bg-muted'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Court */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-border shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Select a Court</h2>
            <div className="grid grid-cols-2 gap-6">
              {courts.map((court) => (
                <button
                  key={court.id}
                  onClick={() => setSelectedCourt(court.id)}
                  className={`
                    p-6 rounded-xl border-2 text-left transition-all
                    ${selectedCourt === court.id 
                      ? 'border-[#10b981] bg-[#d1fae5]' 
                      : 'border-border hover:border-[#10b981]'
                    }
                  `}
                >
                  <div className="h-32 bg-gradient-to-br from-[#10b981] to-[#3b82f6] rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-5xl">⚽</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">{court.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{court.type}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Starting from</p>
                    <p className="text-lg font-semibold text-[#10b981]">₹{court.price}/hr</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => selectedCourt && setStep(2)}
              disabled={!selectedCourt}
              className="w-full mt-8 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Date Selection
            </button>
          </div>
        )}

        {/* Step 2: Choose Date */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-border shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Choose Date</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">Select a date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              />
            </div>
            {selectedDate && (
              <div className="bg-[#d1fae5] rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#059669]" />
                  <div>
                    <p className="text-sm text-[#059669]">Selected Date</p>
                    <p className="font-semibold text-[#059669]">
                      {new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => selectedDate && setStep(3)}
                disabled={!selectedDate}
                className="flex-1 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Time Slot
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pick Time Slot */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-border shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Pick Time Slot</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => slot.available && setSelectedSlot(slot.id)}
                  disabled={!slot.available}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${selectedSlot === slot.id 
                      ? 'border-[#10b981] bg-[#d1fae5]' 
                      : slot.available 
                        ? 'border-border hover:border-[#10b981]' 
                        : 'border-border opacity-50 cursor-not-allowed bg-muted'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">{slot.time}</p>
                  </div>
                  <p className="text-lg font-semibold text-[#10b981]">₹{slot.price}</p>
                  {!slot.available && <p className="text-xs text-[#ef4444] mt-1">Already Booked</p>}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => selectedSlot && setStep(4)}
                disabled={!selectedSlot}
                className="flex-1 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Confirmation
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm Booking */}
        {step === 4 && (
          <div className="bg-white rounded-xl border border-border shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-[#10b981]" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Confirm Your Booking</h2>
              <p className="text-muted-foreground">Please review your booking details</p>
            </div>

            <div className="bg-muted rounded-lg p-6 space-y-4 mb-8">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-muted-foreground">Court:</span>
                <span className="font-semibold text-foreground">{selectedCourtData?.name} - {selectedCourtData?.type}</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-semibold text-foreground">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-semibold text-foreground">{selectedSlotData?.time}</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-lg font-semibold text-foreground">Total Amount:</span>
                <span className="text-3xl font-bold text-[#10b981]">₹{selectedSlotData?.price}</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => alert('Booking confirmed! You will receive a confirmation email shortly.')}
                className="flex-1 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors"
              >
                Confirm & Pay ₹{selectedSlotData?.price}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
