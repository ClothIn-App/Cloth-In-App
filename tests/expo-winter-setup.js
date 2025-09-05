// tests/expo-winter-setup.js
// Enable Winter’s Jest hooks so importing app code works in tests.
try {
  // SDK 53+ (current)
  require('expo/winter/jest');
} catch {
  // Fallback name used in earlier prereleases
  try { require('expo/winter/testing'); } catch {}
}
