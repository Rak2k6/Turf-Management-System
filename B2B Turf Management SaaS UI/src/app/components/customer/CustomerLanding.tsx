import { Calendar, Clock, MapPin, Star, Users, Shield } from 'lucide-react';

export function CustomerLanding() {
  const courts = [
    { id: 1, name: 'Court A', type: 'Football', image: 'football', price: 50, rating: 4.8, reviews: 124 },
    { id: 2, name: 'Court B', type: 'Cricket', image: 'cricket', price: 50, rating: 4.9, reviews: 98 },
    { id: 3, name: 'Court C', type: 'Football', image: 'football', price: 50, rating: 4.7, reviews: 156 },
    { id: 4, name: 'Court D', type: 'Badminton', image: 'badminton', price: 40, rating: 4.9, reviews: 203 },
  ];

  const features = [
    { icon: Calendar, title: 'Easy Booking', description: 'Book your favorite court in just a few clicks' },
    { icon: Clock, title: 'Flexible Timing', description: 'Available from 6 AM to 11 PM every day' },
    { icon: Shield, title: 'Secure Payment', description: 'Multiple payment options with 100% security' },
    { icon: Users, title: 'Community', description: 'Join our community of sports enthusiasts' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 md:w-12 h-10 md:h-12 rounded-lg bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
                <span className="text-lg md:text-xl font-bold text-white">GV</span>
              </div>
              <div className="hidden sm:block">
                <h2 className="text-base md:text-lg font-semibold text-foreground">Green Valley Sports</h2>
                <p className="text-xs text-muted-foreground">Premium Sports Facilities</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <a href="#courts" className="hidden md:inline text-foreground text-sm md:text-base hover:text-primary transition-colors">Courts</a>
              <a href="#about" className="hidden md:inline text-foreground text-sm md:text-base hover:text-primary transition-colors">About</a>
              <a href="#contact" className="hidden md:inline text-foreground text-sm md:text-base hover:text-primary transition-colors">Contact</a>
              <button className="px-3 md:px-6 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors text-sm md:text-base">
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] bg-gradient-to-br from-[#10b981] to-[#3b82f6] overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">Play Your Best Game</h1>
            <p className="text-base md:text-xl mb-6 md:mb-8 opacity-90">
              Premium sports facilities with state-of-the-art courts for football, cricket, badminton and more
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 mb-8">
              <button className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-white text-[#10b981] rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm md:text-base">
                Book Now
              </button>
              <button className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-medium text-sm md:text-base">
                View Courts
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-8 mt-6 md:mt-8">
              <div>
                <p className="text-2xl md:text-3xl font-bold">500+</p>
                <p className="text-xs md:text-sm opacity-80">Happy Players</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold">4.8</p>
                <p className="text-xs md:text-sm opacity-80">Average Rating</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold">24/7</p>
                <p className="text-xs md:text-sm opacity-80">Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 md:mb-4">Why Choose Us</h2>
            <p className="text-sm md:text-base text-muted-foreground">Experience the best sports facilities with premium amenities</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center">
                  <div className="bg-[#d1fae5] w-14 md:w-16 h-14 md:h-16 rounded-lg flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Icon className="w-7 md:w-8 h-7 md:h-8 text-[#10b981]" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Courts */}
      <section id="courts" className="py-12 md:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 md:mb-4">Our Courts</h2>
            <p className="text-sm md:text-base text-muted-foreground">Choose from our world-class sports facilities</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {courts.map((court) => (
              <div key={court.id} className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 md:h-48 bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center">
                  <span className="text-5xl md:text-6xl">⚽</span>
                </div>
                <div className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-foreground">{court.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{court.type}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#f59e0b] fill-[#f59e0b]" />
                      <span className="text-xs md:text-sm font-medium text-foreground">{court.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{court.reviews} reviews</p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Starting from</p>
                      <p className="text-xl md:text-2xl font-bold text-[#10b981]">₹{court.price}/hr</p>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors text-sm md:text-base">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 md:mb-4">Visit Us</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-6">
                Located in the heart of the city with easy access and ample parking facilities
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#10b981] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm md:text-base">Address</p>
                    <p className="text-muted-foreground text-xs md:text-sm">123 Sports Avenue, Green Valley, CA 90210</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#10b981] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm md:text-base">Operating Hours</p>
                    <p className="text-muted-foreground text-xs md:text-sm">Monday - Sunday: 6:00 AM - 11:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-64 md:h-96 bg-muted rounded-xl flex items-center justify-center">
              <MapPin className="w-20 md:w-24 h-20 md:h-24 text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-10 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div>
              <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Green Valley Sports</h3>
              <p className="text-xs md:text-sm text-white/70">Premium sports facilities for everyone</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Quick Links</h4>
              <ul className="space-y-2 text-xs md:text-sm text-white/70">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Courts</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Support</h4>
              <ul className="space-y-2 text-xs md:text-sm text-white/70">
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Cancellation Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>Phone: +1 (555) 123-4567</li>
                <li>Email: info@greenvalley.com</li>
                <li>Address: 123 Sports Avenue</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-white/70">
            <p>&copy; 2024 Green Valley Sports. All rights reserved. Powered by TurfManager</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
