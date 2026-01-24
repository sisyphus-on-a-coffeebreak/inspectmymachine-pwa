// ============================================
// REACT STATE FIX - Handles stuck React component state
// Paste this in console
// ============================================

(function() {
  console.log('🚨 REACT STATE FIX - Comprehensive cleanup...');
  
  let removed = 0;
  
  // STEP 1: Remove ALL fixed elements with high z-index
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed') {
      const z = parseInt(style.zIndex) || 0;
      if (z >= 99 && !el.getAttribute('aria-label')?.includes('Emergency')) {
        console.log('   Removing:', el.tagName, 'z-index:', z);
        el.remove();
        removed++;
      }
    }
  });
  
  // STEP 2: Remove by selectors
  document.querySelectorAll('.bottom-sheet-backdrop, .bottom-sheet, [role="dialog"], [aria-modal="true"]').forEach(el => {
    console.log('   Removing:', el.className || el.tagName);
    el.remove();
    removed++;
  });
  
  // STEP 3: FORCE unlock body scroll (even if React state thinks it should be locked)
  const originalOverflow = document.body.style.overflow;
  const originalPosition = document.body.style.position;
  const originalWidth = document.body.style.width;
  const originalHeight = document.body.style.height;
  
  // Remove ALL inline styles
  document.body.style.cssText = '';
  document.body.removeAttribute('style');
  
  // Force set to auto
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('position', '', 'important');
  document.body.style.setProperty('width', '', 'important');
  document.body.style.setProperty('height', '', 'important');
  document.body.style.setProperty('pointer-events', 'auto', 'important');
  
  // Reset html
  document.documentElement.style.cssText = '';
  document.documentElement.style.setProperty('overflow', '', 'important');
  document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
  
  // Remove classes that might lock scroll
  document.body.classList.remove('keyboard-visible', 'modal-open', 'bottom-sheet-open');
  
  // STEP 4: Try to trigger React cleanup by dispatching events
  // This might help React components detect that they should close
  window.dispatchEvent(new Event('resize'));
  window.dispatchEvent(new Event('orientationchange'));
  
  // STEP 5: Check if React DevTools is available and log component tree
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('🔍 React DevTools detected. Checking for stuck components...');
    try {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.renderers && hook.renderers.size > 0) {
        console.log('   React renderers found:', hook.renderers.size);
        // Note: We can't directly access component state, but we can log that React is active
      }
    } catch (e) {
      console.log('   Could not access React DevTools:', e.message);
    }
  }
  
  // STEP 6: Remove React portals (elements directly under body)
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
  
  console.log('✅ Removed ' + removed + ' DOM elements');
  console.log('✅ Body scroll FORCED unlocked (with !important)');
  console.log('✅ Pointer events enabled');
  console.log('');
  console.log('💡 If screen is STILL blocked:');
  console.log('   1. The React component state might be stuck');
  console.log('   2. Open React DevTools and check for Modal/BottomSheet with isOpen=true');
  console.log('   3. Or refresh the page: location.reload()');
  console.log('');
  console.log('🔄 To force refresh: location.reload(true)');
  
  // Final check after a delay
  setTimeout(() => {
    const stillFixed = document.querySelectorAll('[style*="position: fixed"]').length;
    const bodyOverflow = window.getComputedStyle(document.body).overflow;
    
    if (stillFixed > 1 || bodyOverflow === 'hidden') {
      console.warn('⚠️ WARNING: Still ' + stillFixed + ' fixed elements or body overflow is hidden');
      console.warn('   Body overflow computed:', bodyOverflow);
      console.warn('   This suggests React state is stuck. Refresh the page.');
    } else {
      console.log('✅ All clear! Screen should be usable now.');
    }
  }, 500);
})();



