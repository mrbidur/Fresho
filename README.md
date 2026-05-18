# Fresho

Fresho is an appointment marketplace app for Nepal, connecting clients with salons, spas, dental clinics, and beauty professionals. Book appointments at the best venues in Kathmandu with just a few taps.

## Features

- **Category browsing** - Hair & Barber, Dental Care, Spa & Wellness, Skin Aesthetics, Nails & Makeup
- **Venue discovery** - Browse nearby venues with ratings, distance, and real photos
- **Full booking flow** - Select service, pick a date on the calendar, choose a time slot, and select your specialist
- **Dual payment options** - Pay at venue or pay now via digital wallet (eSewa/Khalti/Fonepay)
- **Customer reviews** - Read ratings and reviews from other customers before booking
- **Provider dashboard** - Manage incoming appointments, track wallet balance, and view revenue
- **Wallet reconciliation** - Automatic 10% commission deduction from provider wallet on each completed booking

## Web Version

Open `index.html` directly in any browser to use the desktop/responsive web version.

```
open index.html
```

## Mobile App (PWA)

The `app/` directory contains a Progressive Web App (PWA) version optimized for mobile devices. It provides a native app-like experience with:

- Bottom tab navigation (Home, Bookings, Provider, Profile)
- Full-screen modal transitions (swipe down to dismiss)
- Pull-to-refresh gesture
- Floating action button for quick booking
- Offline support via service worker
- Install to home screen capability
- Safe area inset support for modern phones (notch, gesture bar)

### How to Install on Your Phone

1. Open `app/index.html` on your phone's browser (serve it via any local or remote HTTP server)
2. **Android (Chrome):** Tap the three-dot menu and select "Add to Home Screen"
3. **iOS (Safari):** Tap the Share button and select "Add to Home Screen"
4. The app will appear on your home screen and launch in full-screen standalone mode

### Local Development

Serve the project root with any static HTTP server:

```bash
# Python
python3 -m http.server 8000

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8000/app/` on your phone (same Wi-Fi network) or use the browser DevTools mobile emulator.

## Project Structure

```
Fresho/
  index.html          # Desktop/responsive web version
  README.md           # This file
  app/
    index.html        # Mobile PWA version (native-like UX)
    manifest.json     # PWA manifest (app metadata, icons)
    sw.js             # Service worker (offline caching)
```

## Tech Stack

- React 18 (via CDN)
- Tailwind CSS (via CDN)
- Babel Standalone (JSX in-browser compilation)
- No build step required
