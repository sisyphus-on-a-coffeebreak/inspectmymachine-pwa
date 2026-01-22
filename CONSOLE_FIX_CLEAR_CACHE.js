// ============================================
// CLEAR CACHE AND SERVICE WORKER
// Run this to clear cached data that might be causing issues
// ============================================

(function() {
  console.log('🔧 Clearing cache and service workers...');
  
  // 1. Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log(`Found ${registrations.length} service worker(s)`);
      registrations.forEach(registration => {
        registration.unregister().then(success => {
          if (success) {
            console.log('✅ Service worker unregistered');
          } else {
            console.warn('⚠️ Failed to unregister service worker');
          }
        });
      });
    });
  }
  
  // 2. Clear all caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      console.log(`Found ${cacheNames.length} cache(s)`);
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log(`   Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ All caches cleared');
    });
  }
  
  // 3. Clear localStorage (optional - be careful!)
  console.log('💡 To clear localStorage, run: localStorage.clear()');
  console.log('💡 To clear sessionStorage, run: sessionStorage.clear()');
  
  // 4. Remove any blocking overlays
  document.querySelectorAll('[role="dialog"], [aria-modal="true"], .bottom-sheet-backdrop').forEach(el => el.remove());
  
  // 5. Force unlock body
  document.body.style.cssText = '';
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('pointer-events', 'auto', 'important');
  
  console.log('✅ Cache clearing initiated');
  console.log('🔄 Now do a hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
  console.log('💡 If that doesn\'t work, the issue is likely a browser extension.');
  console.log('   Try disabling extensions one by one to find the culprit.');
})();

