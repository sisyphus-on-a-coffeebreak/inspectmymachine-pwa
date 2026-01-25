// ============================================
// AGGRESSIVE CACHE CLEAR
// Clears everything that might be causing issues
// ============================================

(function() {
  console.log('🧹 Aggressive cache clearing...');
  
  let cleared = 0;
  
  // 1. Unregister ALL service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log(`Found ${registrations.length} service worker(s)`);
      registrations.forEach(registration => {
        registration.unregister().then(success => {
          if (success) {
            cleared++;
            console.log(`✅ Service worker ${cleared} unregistered`);
          }
        });
      });
    });
  }
  
  // 2. Clear ALL caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      console.log(`Found ${cacheNames.length} cache(s)`);
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log(`   Deleting: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ All caches deleted');
      cleared++;
    });
  }
  
  // 3. Clear localStorage (be careful - this will log you out!)
  try {
    const localStorageKeys = Object.keys(localStorage);
    console.log(`Found ${localStorageKeys.length} localStorage items`);
    if (localStorageKeys.length > 0) {
      // Clear everything except theme preference
      localStorageKeys.forEach(key => {
        if (key !== 'voms_theme') { // Keep theme preference
          localStorage.removeItem(key);
          cleared++;
        }
      });
      console.log('✅ localStorage cleared (except theme)');
    }
  } catch (e) {
    console.warn('⚠️ Could not clear localStorage:', e.message);
  }
  
  // 4. Clear sessionStorage
  try {
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
    cleared++;
  } catch (e) {
    console.warn('⚠️ Could not clear sessionStorage:', e.message);
  }
  
  // 5. Clear IndexedDB (if accessible)
  if ('indexedDB' in window) {
    // List all databases
    indexedDB.databases().then(databases => {
      console.log(`Found ${databases.length} IndexedDB database(s)`);
      databases.forEach(db => {
        console.log(`   Database: ${db.name} (version: ${db.version})`);
      });
      console.log('💡 IndexedDB requires manual deletion in DevTools > Application > IndexedDB');
    });
  }
  
  // 6. Remove all blocking overlays
  document.querySelectorAll('[role="dialog"], [aria-modal="true"], .bottom-sheet-backdrop, .bottom-sheet').forEach(el => {
    el.remove();
    cleared++;
  });
  
  // 7. Force unlock body
  document.body.style.cssText = '';
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('position', 'static', 'important');
  document.body.style.setProperty('pointer-events', 'auto', 'important');
  document.body.classList.remove('keyboard-visible', 'modal-open', 'bottom-sheet-open');
  
  // 8. Remove CSS override if it exists
  const overrideStyle = document.getElementById('force-light-theme-override');
  if (overrideStyle) {
    overrideStyle.remove();
    console.log('✅ Removed CSS override');
  }
  
  // 9. Clear any stuck React state (if possible)
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('💡 React DevTools detected - check for stuck component state');
  }
  
  console.log(`\n✅ Cleared ${cleared} items`);
  console.log('\n🔄 NEXT STEPS:');
  console.log('   1. Close this tab completely');
  console.log('   2. Open a NEW tab');
  console.log('   3. Navigate to the site');
  console.log('   4. Try Cmd+Shift+R again');
  console.log('\n💡 If it STILL doesn\'t work:');
  console.log('   - Clear browser cache: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)');
  console.log('   - Select "All time" and clear everything');
  console.log('   - Or use: chrome://settings/clearBrowserData');
})();




