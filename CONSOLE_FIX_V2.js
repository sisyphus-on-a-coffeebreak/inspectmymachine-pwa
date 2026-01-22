// ============================================
// EMERGENCY FIX V2 - More Aggressive
// Paste this ENTIRE block in console
// ============================================

(function() {
  console.log('🔍 Advanced diagnostic...');
  
  // Find ALL fixed elements, regardless of z-index
  const allFixed = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed') {
      const rect = el.getBoundingClientRect();
      allFixed.push({
        element: el,
        tag: el.tagName,
        id: el.id,
        classes: el.className,
        zIndex: style.zIndex,
        backgroundColor: style.backgroundColor,
        opacity: style.opacity,
        display: style.display,
        visibility: style.visibility,
        width: rect.width,
        height: rect.height,
        coversScreen: rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9,
        role: el.getAttribute('role'),
        ariaModal: el.getAttribute('aria-modal'),
        html: el.outerHTML.substring(0, 200)
      });
    }
  });
  
  console.log('📊 All fixed elements:', allFixed.length);
  console.table(allFixed);
  
  // Find elements that cover the screen
  const screenCoverers = allFixed.filter(x => x.coversScreen);
  console.log('🖥️ Elements covering screen:', screenCoverers.length);
  if (screenCoverers.length > 0) {
    console.table(screenCoverers);
    screenCoverers.forEach(x => {
      x.element.style.border = '10px solid red';
      console.log('   Highlighted:', x.tag, 'z-index:', x.zIndex);
    });
  }
  
  // Check body and html for dark backgrounds
  const bodyBg = window.getComputedStyle(document.body).backgroundColor;
  const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
  console.log('Body background:', bodyBg);
  console.log('HTML background:', htmlBg);
  
  // Check for backdrop-filter
  const hasBackdrop = [];
  allFixed.forEach(x => {
    const backdrop = window.getComputedStyle(x.element).backdropFilter;
    if (backdrop && backdrop !== 'none') {
      hasBackdrop.push(x);
    }
  });
  if (hasBackdrop.length > 0) {
    console.log('🎭 Elements with backdrop-filter:', hasBackdrop);
  }
  
  // FIX: Remove all screen-covering elements
  console.log('🔧 Removing screen-covering elements...');
  let removed = 0;
  
  allFixed.forEach(item => {
    const el = item.element;
    const bg = item.backgroundColor;
    const z = parseInt(item.zIndex) || 0;
    
    // Remove if:
    // 1. Covers screen AND has dark background
    // 2. Is a dialog/modal
    // 3. Has high z-index AND dark background
    // 4. Has backdrop-filter (likely a modal backdrop)
    const backdrop = window.getComputedStyle(el).backdropFilter;
    
    if (
      (item.coversScreen && (bg.includes('rgba(0') || backdrop !== 'none')) ||
      item.role === 'dialog' ||
      item.ariaModal === 'true' ||
      (z >= 8000 && (bg.includes('rgba(0') || backdrop !== 'none')) ||
      (z >= 99 && item.coversScreen)
    ) {
      // Skip emergency button
      if (el.getAttribute('aria-label')?.includes('Emergency')) {
        console.log('   Skipping emergency button');
        return;
      }
      
      console.log('   Removing:', item.tag, 'z-index:', item.zIndex, 'coversScreen:', item.coversScreen);
      el.remove();
      removed++;
    }
  });
  
  // Remove all modals and dialogs
  document.querySelectorAll('[role="dialog"], [aria-modal="true"]').forEach(el => {
    console.log('   Removing dialog:', el);
    el.remove();
    removed++;
  });
  
  // Remove BottomSheet backdrops specifically
  document.querySelectorAll('.bottom-sheet-backdrop').forEach(el => {
    console.log('   Removing BottomSheet backdrop');
    el.remove();
    removed++;
  });
  
  // Remove FAB backdrops
  document.querySelectorAll('[style*="inset: 0"][style*="rgba(0, 0, 0"]').forEach(el => {
    console.log('   Removing FAB/backdrop');
    el.remove();
    removed++;
  });
  
  // Unlock body completely
  document.body.style.cssText = '';
  document.documentElement.style.overflow = '';
  document.body.className = '';
  document.body.classList.remove('keyboard-visible');
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.height = '';
  
  // Reset html element
  document.documentElement.style.overflow = '';
  document.documentElement.style.position = '';
  
  console.log('✅ Removed ' + removed + ' blocking elements');
  console.log('✅ Body scroll unlocked');
  
  // Final check
  setTimeout(() => {
    const remaining = document.querySelectorAll('[style*="position: fixed"]').length;
    if (remaining > 0) {
      console.warn('⚠️ Still ' + remaining + ' fixed elements. Listing them:');
      document.querySelectorAll('[style*="position: fixed"]').forEach(el => {
        const s = window.getComputedStyle(el);
        console.log('   -', el.tagName, 'z-index:', s.zIndex, 'bg:', s.backgroundColor, 'size:', el.getBoundingClientRect().width + 'x' + el.getBoundingClientRect().height);
      });
    } else {
      console.log('✅ All fixed overlays cleared!');
    }
  }, 500);
})();

