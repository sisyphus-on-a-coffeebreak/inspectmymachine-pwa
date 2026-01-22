// ============================================
// FINAL EMERGENCY FIX - Targets BottomSheet specifically
// Paste this in console
// ============================================

(function() {
  console.log('🚨 EMERGENCY FIX - Removing all blocking overlays...');
  
  // 1. Remove BottomSheet backdrops specifically
  const bottomSheetBackdrops = document.querySelectorAll('.bottom-sheet-backdrop');
  console.log('Found BottomSheet backdrops:', bottomSheetBackdrops.length);
  bottomSheetBackdrops.forEach(el => {
    console.log('   Removing BottomSheet backdrop');
    el.remove();
  });
  
  // 2. Remove all elements with rgba(0, 0, 0, 0.45) or similar dark backgrounds
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed') {
      const bg = style.backgroundColor;
      // Match rgba(0, 0, 0, 0.45) or rgba(0,0,0,0.45) or similar
      if (bg.match(/rgba\(0,\s*0,\s*0,\s*0\.\d+\)/) || bg.match(/rgba\(0,0,0,0\.\d+\)/)) {
        console.log('   Removing dark backdrop:', el.tagName, 'bg:', bg);
        el.remove();
      }
    }
  });
  
  // 3. Remove all fixed elements with inset: 0 (full screen overlays)
  document.querySelectorAll('[style*="inset: 0"], [style*="inset:0"]').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed') {
      console.log('   Removing full-screen overlay');
      el.remove();
    }
  });
  
  // 4. Remove all dialogs and modals
  document.querySelectorAll('[role="dialog"], [aria-modal="true"], .bottom-sheet').forEach(el => {
    console.log('   Removing dialog/modal:', el.tagName);
    el.remove();
  });
  
  // 5. Remove FAB backdrops
  document.querySelectorAll('div').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' && 
        (style.top === '0px' || style.top === '0') &&
        (style.left === '0px' || style.left === '0') &&
        (style.right === '0px' || style.right === '0') &&
        (style.bottom === '0px' || style.bottom === '0') &&
        style.backgroundColor.includes('rgba(0')) {
      console.log('   Removing FAB/backdrop');
      el.remove();
    }
  });
  
  // 6. Unlock body completely
  document.body.style.cssText = '';
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.height = '';
  document.body.className = '';
  document.body.classList.remove('keyboard-visible');
  document.documentElement.style.overflow = '';
  
  // 7. Force remove any remaining high z-index fixed elements
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed') {
      const z = parseInt(style.zIndex) || 0;
      if (z >= 8000) {
        const bg = style.backgroundColor;
        if (bg.includes('rgba(0') || el.getAttribute('role') === 'dialog') {
          console.log('   Force removing:', el.tagName, 'z-index:', z);
          el.remove();
        }
      }
    }
  });
  
  console.log('✅ Emergency fix complete!');
  console.log('✅ If screen is still dark, refresh the page (Cmd+R or Ctrl+R)');
})();

