// Mobile-first responsive utilities
export const responsive = {
    // Padding helpers
    px: 'px-3 sm:px-4 md:px-6 lg:px-8',
    py: 'py-2 sm:py-3 md:py-4 lg:py-6',
    p: 'p-3 sm:p-4 md:p-6 lg:p-8',

    // Gap helpers (for flex/grid)
    gapX: 'gap-2 sm:gap-3 md:gap-4 lg:gap-6',
    gapY: 'gap-2 sm:gap-3 md:gap-4 lg:gap-6',
    gap: 'gap-2 sm:gap-3 md:gap-4 lg:gap-6',

    // Font size helpers
    textSm: 'text-xs sm:text-xs md:text-sm lg:text-base',
    textBase: 'text-sm sm:text-base md:text-base lg:text-lg',
    textLg: 'text-base sm:text-lg md:text-xl lg:text-2xl',
    textXl: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',

    // Button size helpers
    btnSm: 'px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm',
    btnBase: 'px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base',
    btnLg: 'px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg',

    // Grid helpers
    gridCols1to2: 'grid-cols-1 sm:grid-cols-2',
    gridCols1to3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    gridCols1to4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

// Tailwind breakpoint utilities
export const breakpoints = {
    sm: '640px',   // mobile
    md: '768px',   // tablet
    lg: '1024px',  // desktop
    xl: '1280px',  // large desktop
};

// Mobile-friendly spacing
export const mobileSpacing = {
    compact: 'gap-1 md:gap-2',
    comfortable: 'gap-2 md:gap-3',
    spacious: 'gap-3 md:gap-4',
};

// Touch target size (minimum 44px for mobile)
export const touchTarget = 'min-h-[44px] min-w-[44px]';
