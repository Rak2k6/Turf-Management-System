import { useState } from 'react';
import { Palette, Upload, Eye } from 'lucide-react';

export function BrandingCustomization() {
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#3b82f6');
  const [turfName, setTurfName] = useState('Green Valley Sports');
  const [domain, setDomain] = useState('greenvalley');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Branding & Customization</h2>
            <p className="text-muted-foreground text-sm mt-1">Customize your turf's brand identity and appearance</p>
          </div>
          <button className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Settings */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Turf Name</label>
                <input
                  type="text"
                  value={turfName}
                  onChange={(e) => setTurfName(e.target.value)}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Custom Domain</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="flex-1 px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-muted-foreground">.turfbook.com</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tagline</label>
                <input
                  type="text"
                  placeholder="Where champions are made"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Logo & Images</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Logo</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-foreground mb-1">Click to upload logo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG or SVG (max. 2MB)</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Banner Image</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-foreground mb-1">Click to upload banner</p>
                  <p className="text-xs text-muted-foreground">PNG or JPG (max. 5MB, 1920x400 recommended)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Color Scheme */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Color Scheme
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Primary Color</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-12 rounded-lg cursor-pointer border border-border"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Secondary Color</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-16 h-12 rounded-lg cursor-pointer border border-border"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-4">
                {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'].map(color => (
                  <button
                    key={color}
                    onClick={() => setPrimaryColor(color)}
                    className="w-full h-12 rounded-lg border-2 border-border hover:border-foreground transition-colors"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Live Preview</h3>
            
            {/* Preview Website */}
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border" style={{ backgroundColor: primaryColor }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold" style={{ color: primaryColor }}>
                        {turfName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{turfName}</h4>
                      <p className="text-xs text-white opacity-80">{domain}.turfbook.com</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-16 h-8 bg-white rounded text-xs flex items-center justify-center" style={{ color: primaryColor }}>
                      Login
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Section */}
              <div className="h-40 bg-gradient-to-br flex items-center justify-center" style={{ 
                backgroundImage: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` 
              }}>
                <div className="text-center text-white">
                  <h2 className="text-2xl font-bold mb-2">Book Your Court Today</h2>
                  <p className="text-sm opacity-90">Premium sports facilities at your fingertips</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {['Court A', 'Court B', 'Court C'].map(court => (
                    <div key={court} className="border border-border rounded-lg p-3">
                      <div className="h-16 rounded-lg mb-2" style={{ backgroundColor: `${primaryColor}20` }}></div>
                      <p className="text-xs font-medium text-foreground">{court}</p>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button 
                  className="w-full py-3 rounded-lg text-white font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>

          {/* Theme Presets */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Theme Presets</h3>
            <div className="space-y-3">
              {[
                { name: 'Fresh Green', primary: '#10b981', secondary: '#3b82f6' },
                { name: 'Ocean Blue', primary: '#3b82f6', secondary: '#06b6d4' },
                { name: 'Sunset Orange', primary: '#f59e0b', secondary: '#ef4444' },
                { name: 'Royal Purple', primary: '#8b5cf6', secondary: '#ec4899' },
              ].map(theme => (
                <button
                  key={theme.name}
                  onClick={() => {
                    setPrimaryColor(theme.primary);
                    setSecondaryColor(theme.secondary);
                  }}
                  className="w-full p-4 border border-border rounded-lg hover:border-primary transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-foreground">{theme.name}</span>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.secondary }}></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Make sure to save your changes before leaving this page</p>
          <div className="flex gap-3">
            <button className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">
              Reset
            </button>
            <button className="px-6 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
