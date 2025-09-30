# Favicon Setup for SN Clinic

This document describes the comprehensive favicon setup for the SN Clinic frontend application.

## 📁 Files Created

The following favicon files have been created in the `/public` directory:

### Core Favicon Files
- `favicon.ico` - Legacy ICO format for older browsers
- `favicon.svg` - Modern SVG favicon (scalable, supports dark mode)
- `favicon-16x16.png` - 16x16 PNG favicon
- `favicon-32x32.png` - 32x32 PNG favicon

### Apple Touch Icons
- `apple-touch-icon.png` - 180x180 PNG for iOS home screen

### Android Chrome Icons
- `android-chrome-192x192.png` - 192x192 PNG for Android
- `android-chrome-512x512.png` - 512x512 PNG for Android

### Safari Pinned Tab
- `safari-pinned-tab.svg` - Monochrome SVG for Safari pinned tabs

### Web App Manifest
- `site.webmanifest` - PWA manifest file

## 🎨 Design

The favicon features a medical cross design with:
- **Colors**: Teal gradient (#10b981 to #059669) matching the clinic's brand
- **Background**: Circular gradient with subtle border
- **Icon**: White medical cross (plus sign)
- **Accents**: Small white dots in corners for visual interest

## 🔧 Configuration

### Next.js Metadata
The favicon is configured in `/src/app/layout.tsx` with comprehensive metadata including:

```typescript
export const metadata: Metadata = {
  // ... other metadata
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#10b981",
      },
    ],
  },
  manifest: "/site.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
};
```

### Web App Manifest
The `site.webmanifest` file provides PWA support with:
- App name and description
- Theme colors
- Icon definitions
- Display mode settings

## 🚀 Usage

### Development
The favicon will automatically be served by Next.js from the `/public` directory.

### Regenerating Favicons
To regenerate favicon files, run:

```bash
npm run generate-favicons
```

This will run the script at `/scripts/generate-favicons-sharp.js` which creates all necessary favicon files using Sharp for high-quality image generation.

### Production
For production deployment, ensure all favicon files are included in the build output. Next.js will automatically serve them from the `/public` directory.

## 🌐 Browser Support

The favicon setup supports:
- **Modern browsers**: SVG favicon with fallbacks
- **Legacy browsers**: ICO format
- **iOS Safari**: Apple touch icon
- **Android Chrome**: Android chrome icons
- **Safari**: Pinned tab icon
- **PWA**: Web app manifest

## 🔍 Testing

To verify the favicon is working correctly:

1. **Browser Tab**: Check that the favicon appears in the browser tab
2. **Bookmarks**: Verify favicon shows when bookmarking the site
3. **iOS Home Screen**: Test adding to home screen on iOS devices
4. **Android**: Test adding to home screen on Android devices
5. **Safari Pinned Tabs**: Test pinning the tab in Safari

## 📝 Notes

- All PNG files are now high-quality images generated from the SVG source using Sharp.
- The SVG favicon supports both light and dark themes through CSS media queries.
- All favicon files are optimized for web delivery and follow modern web standards.
- The Sharp-based generation ensures consistent quality across all favicon sizes.

## 🛠️ Customization

To customize the favicon:

1. Edit the SVG content in `/scripts/generate-favicons-sharp.js`
2. Run `npm run generate-favicons` to regenerate all files
3. Update the theme colors in `layout.tsx` if needed
4. Modify the web app manifest for PWA customization

## 📚 References

- [MDN Favicon Guide](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#rel)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
