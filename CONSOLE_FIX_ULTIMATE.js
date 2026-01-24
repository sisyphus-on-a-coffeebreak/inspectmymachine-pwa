// ============================================
// ULTIMATE FIX - Handles everything including pointer-events
// Paste this in console
// ============================================

(function() {
  console.log('🚨 ULTIMATE FIX - Checking everything...');
  
  // Check for pointer-events blocking
  const pointerBlockers = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed') {
      const pointerEvents = style.pointerEvents;
      const z = parseInt(style.zIndex) || 0;
      if (z >= 99) {
        pointerBlockers.push({
          element: el,
          tag: el.tagName,
          zIndex: z,
          pointerEvents: pointerEvents,
          backgroundColor: style.backgroundColor,
          coversScreen: el.getBoundingClientRect().width >= window.innerWidth * 0.9
        });
      }
    }
  });
  
  if (pointerBlockers.length > 0) {
    console.log('🎯 Found potential pointer blockers:');
    console.table(pointerBlockers);
  }
  
  // NUCLEAR OPTION: Remove ALL fixed elements with z-index >= 99 (except emergency button)
  console.log('💣 Removing ALL high z-index fixed elements...');
  let removed = 0;
  
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed') {
      const z = parseInt(style.zIndex) || 0;
      // Remove anything with z-index >= 99 except emergency button
      if (z >= 99 && !el.getAttribute('aria-label')?.includes('Emergency')) {
        console.log('   Removing:', el.tagName, 'z-index:', z);
        el.remove();
        removed++;
      }
    }
  });
  
  // Remove by specific selectors
  document.querySelectorAll('.bottom-sheet-backdrop, .bottom-sheet, [role="dialog"], [aria-modal="true"]').forEach(el => {
    console.log('   Removing:', el.className || el.tagName);
    el.remove();
    removed++;
  });
  
  // Remove React portals (elements directly under body but not in #root)
  Array.from(document.body.children).forEach(child => {
    if (child.id !== 'root' && child.tagName) {
      const style = window.getComputedStyle(child);
      if (style.position === 'fixed' || parseInt(style.zIndex || '0') >= 8000) {
        console.log('   Removing React portal:', child.tagName);
        child.remove();
        removed++;
      }
    }
  });
  
  // COMPLETE body reset
  document.body.style.cssText = '';
  document.body.style.pointerEvents = '';
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.height = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.removeAttribute('style');
  
  // Reset html
  document.documentElement.style.cssText = '';
  document.documentElement.style.pointerEvents = '';
  document.documentElement.style.overflow = '';
  
  // Enable pointer events on everything
  document.body.style.pointerEvents = 'auto';
  document.documentElement.style.pointerEvents = 'auto';
  
  // Remove any elements blocking pointer events
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' && style.pointerEvents !== 'none') {
      const z = parseInt(style.zIndex) || 0;
      if (z >= 99 && !el.getAttribute('aria-label')?.includes('Emergency')) {
        el.style.pointerEvents = 'none'; // Disable first
        setTimeout(() => el.remove(), 50); // Then remove
      }
    }
  });
  
  console.log('✅ Removed ' + removed + ' elements');
  console.log('✅ Pointer events enabled');
  console.log('✅ Body completely reset');
  console.log('');
  console.log('💡 If still blocked, the issue might be:');
  console.log('   1. React component state stuck (refresh page)');
  console.log('   2. CSS from browser extension');
  console.log('   3. Service worker issue');
  console.log('');
  console.log('🔄 Try: location.reload() to force refresh');
})();



