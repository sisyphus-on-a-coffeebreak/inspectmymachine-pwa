// ============================================
// NUCLEAR FIX - Most aggressive, uses !important
// Run this if nothing else works
// ============================================

(function() {
  console.log('💣 NUCLEAR FIX - Using !important to force unlock...');
  
  // Step 1: Remove all overlays
  let removed = 0;
  document.querySelectorAll('[role="dialog"], [aria-modal="true"], .bottom-sheet-backdrop, .bottom-sheet').forEach(el => {
    el.remove();
    removed++;
  });
  
  document.querySelectorAll('*').forEach(el => {
    const s = window.getComputedStyle(el);
    if (s.position === 'fixed' && parseInt(s.zIndex || '0') >= 99 && !el.getAttribute('aria-label')?.includes('Emergency')) {
      el.remove();
      removed++;
    }
  });
  
  // Step 2: NUCLEAR - Force unlock with !important (overrides everything)
  const bodyStyles = [
    'overflow: auto !important',
    'position: static !important',
    'width: auto !important',
    'height: auto !important',
    'top: auto !important',
    'left: auto !important',
    'right: auto !important',
    'bottom: auto !important',
    'pointer-events: auto !important',
    'touch-action: auto !important'
  ];
  
  // Apply via style attribute
  document.body.setAttribute('style', bodyStyles.join('; '));
  
  // Also set individually to ensure they stick
  bodyStyles.forEach(style => {
    const [prop, value] = style.split(': ');
    const cssProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    document.body.style.setProperty(cssProp, value.replace(' !important', ''), 'important');
  });
  
  // Reset html element
  document.documentElement.style.setProperty('overflow', 'auto', 'important');
  document.documentElement.style.setProperty('position', '', 'important');
  document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
  
  // Remove all classes that might lock scroll
  document.body.className = '';
  document.body.classList.remove('keyboard-visible', 'modal-open', 'bottom-sheet-open', 'overflow-hidden');
  document.documentElement.classList.remove('overflow-hidden', 'modal-open');
  
  // Step 3: Check computed styles AFTER fix
  setTimeout(() => {
    const computedBody = window.getComputedStyle(document.body);
    const computedHtml = window.getComputedStyle(document.documentElement);
    
    console.log('📊 AFTER FIX - Computed styles:');
    console.log('   Body overflow:', computedBody.overflow);
    console.log('   Body position:', computedBody.position);
    console.log('   Body pointer-events:', computedBody.pointerEvents);
    console.log('   HTML overflow:', computedHtml.overflow);
    console.log('   HTML position:', computedHtml.position);
    
    // Check if body is still locked
    if (computedBody.overflow === 'hidden' || computedBody.position === 'fixed') {
      console.error('❌ BODY IS STILL LOCKED!');
      console.error('   This means CSS is being applied from somewhere else:');
      console.error('   1. Check browser DevTools > Elements > Styles tab');
      console.error('   2. Look for styles with higher specificity');
      console.error('   3. Check for inline styles in React DevTools');
      console.error('   4. Try: document.body.style.cssText = "";');
    } else {
      console.log('✅ Body appears unlocked in computed styles');
    }
    
    // Check for any remaining fixed elements
    const remainingFixed = [];
    document.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el);
      if (s.position === 'fixed' && parseInt(s.zIndex || '0') >= 99) {
        if (!el.getAttribute('aria-label')?.includes('Emergency')) {
          remainingFixed.push({
            tag: el.tagName,
            zIndex: s.zIndex,
            bg: s.backgroundColor,
            pointerEvents: s.pointerEvents
          });
        }
      }
    });
    
    if (remainingFixed.length > 0) {
      console.warn('⚠️ Still ' + remainingFixed.length + ' fixed elements:');
      console.table(remainingFixed);
    } else {
      console.log('✅ No blocking fixed elements found');
    }
    
    // Final test: Can we click?
    console.log('');
    console.log('🧪 TEST: Try clicking anywhere on the page now.');
    console.log('   If it still doesn\'t work, the issue is likely:');
    console.log('   1. React component state (check React DevTools)');
    console.log('   2. Browser extension blocking clicks');
    console.log('   3. Service worker issue');
    console.log('');
    console.log('🔄 Last resort: location.reload(true)');
  }, 100);
  
  console.log('✅ Removed ' + removed + ' elements');
  console.log('✅ Applied !important styles to body');
  console.log('✅ Removed all locking classes');
  console.log('');
  console.log('⏳ Checking computed styles in 100ms...');
})();




