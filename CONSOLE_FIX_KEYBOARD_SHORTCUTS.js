// ============================================
// KEYBOARD SHORTCUTS FIX
// If Cmd+Shift+R or other shortcuts stopped working
// ============================================

(function() {
  console.log('🔧 Fixing keyboard shortcuts...');
  
  // 1. Remove any event listeners that might be blocking
  // We can't easily remove all listeners, but we can check what's registered
  console.log('1️⃣ Checking for blocking event listeners...');
  
  // 2. Ensure no overlays are blocking
  console.log('2️⃣ Removing any blocking overlays...');
  document.querySelectorAll('[role="dialog"], [aria-modal="true"], .bottom-sheet-backdrop, .bottom-sheet').forEach(el => {
    console.log('   Removing:', el.tagName);
    el.remove();
  });
  
  // 3. Force unlock body
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('position', 'static', 'important');
  document.body.style.setProperty('pointer-events', 'auto', 'important');
  
  // 4. Remove dark class if it's blocking
  if (document.documentElement.classList.contains('dark')) {
    console.log('3️⃣ Dark class is present - this might be causing issues');
    // Don't remove it automatically, just log it
  }
  
  // 5. Check if there are any elements with pointer-events: none on body/root
  const root = document.getElementById('root');
  const bodyStyle = window.getComputedStyle(document.body);
  const rootStyle = root ? window.getComputedStyle(root) : null;
  
  console.log('4️⃣ Current state:');
  console.log('   Body pointer-events:', bodyStyle.pointerEvents);
  console.log('   Body overflow:', bodyStyle.overflow);
  console.log('   Root pointer-events:', rootStyle?.pointerEvents);
  
  // 6. Add a temporary keyboard handler to test
  const testHandler = (e) => {
    if (e.key === 'Escape' || (e.metaKey && e.shiftKey && e.key === 'R')) {
      console.log('✅ Keyboard shortcut detected:', e.key, 'Meta:', e.metaKey, 'Shift:', e.shiftKey);
    }
  };
  document.addEventListener('keydown', testHandler, { capture: true });
  console.log('5️⃣ Added test keyboard handler');
  console.log('   Try Cmd+Shift+R now - you should see a log message');
  
  // 7. Remove the CSS override that might be causing issues
  const overrideStyle = document.getElementById('force-light-theme-override');
  if (overrideStyle) {
    console.log('6️⃣ Found CSS override style - removing it');
    overrideStyle.remove();
  }
  
  console.log('✅ Keyboard shortcuts fix complete!');
  console.log('💡 Try Cmd+Shift+R now. If it still doesn\'t work, the issue might be:');
  console.log('   1. Browser extension blocking shortcuts');
  console.log('   2. Service worker issue');
  console.log('   3. React component blocking events');
})();



