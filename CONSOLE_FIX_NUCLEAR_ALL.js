// ============================================
// NUCLEAR FIX - Forces EVERYTHING visible and clickable
// Run this as a last resort
// ============================================

(function() {
  console.log('💣 NUCLEAR FIX - Forcing everything visible and clickable...');
  
  // 1. Remove ALL overlays
  document.querySelectorAll('[role="dialog"], [aria-modal="true"], .bottom-sheet-backdrop, .bottom-sheet').forEach(el => el.remove());
  document.querySelectorAll('*').forEach(el => {
    const s = window.getComputedStyle(el);
    if (s.position === 'fixed' && parseInt(s.zIndex || '0') >= 99 && !el.getAttribute('aria-label')?.includes('Emergency')) {
      el.remove();
    }
  });
  
  // 2. Force root to be visible and clickable
  const root = document.getElementById('root');
  if (root) {
    root.style.setProperty('opacity', '1', 'important');
    root.style.setProperty('visibility', 'visible', 'important');
    root.style.setProperty('pointer-events', 'auto', 'important');
    root.style.setProperty('display', 'block', 'important');
    root.style.setProperty('position', 'relative', 'important');
    root.style.setProperty('z-index', '1', 'important');
    console.log('✅ Root forced visible');
  }
  
  // 3. Force body to be unlocked and clickable
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('position', 'static', 'important');
  document.body.style.setProperty('width', 'auto', 'important');
  document.body.style.setProperty('height', 'auto', 'important');
  document.body.style.setProperty('pointer-events', 'auto', 'important');
  document.body.style.setProperty('opacity', '1', 'important');
  document.body.style.setProperty('visibility', 'visible', 'important');
  document.body.removeAttribute('style');
  // Re-apply critical styles
  document.body.style.overflow = 'auto';
  document.body.style.pointerEvents = 'auto';
  document.body.style.opacity = '1';
  
  // 4. Force html to be unlocked
  document.documentElement.style.setProperty('overflow', 'auto', 'important');
  document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
  document.documentElement.style.setProperty('opacity', '1', 'important');
  document.documentElement.style.setProperty('visibility', 'visible', 'important');
  
  // 5. Remove all blocking classes
  document.body.className = '';
  document.documentElement.className = document.documentElement.className.replace(/overflow-hidden|modal-open|bottom-sheet-open/g, '');
  
  // 6. Force ALL children of root to be visible
  if (root) {
    let fixed = 0;
    root.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      const opacity = parseFloat(style.opacity);
      const pointerEvents = style.pointerEvents;
      
      // If opacity is 0 or pointer-events is none, fix it
      if (opacity === 0 || pointerEvents === 'none') {
        const rect = el.getBoundingClientRect();
        // Only fix if it's a significant element
        if (rect.width > 100 || rect.height > 100) {
          el.style.setProperty('opacity', '1', 'important');
          el.style.setProperty('pointer-events', 'auto', 'important');
          el.style.setProperty('visibility', 'visible', 'important');
          fixed++;
        }
      }
    });
    if (fixed > 0) {
      console.log('✅ Fixed ' + fixed + ' child elements');
    }
  }
  
  // 7. Remove any event listeners that might be blocking
  // We can't easily remove all listeners, but we can try to override preventDefault
  const originalPreventDefault = Event.prototype.preventDefault;
  let preventDefaultCount = 0;
  Event.prototype.preventDefault = function() {
    preventDefaultCount++;
    if (preventDefaultCount < 10) {
      console.warn('⚠️ preventDefault called', preventDefaultCount, 'times');
    }
    // Don't actually prevent - allow default behavior
    // originalPreventDefault.call(this);
  };
  
  // 8. Final check
  setTimeout(() => {
    const rootStyle = window.getComputedStyle(root || document.body);
    const bodyStyle = window.getComputedStyle(document.body);
    
    console.log('\n📊 AFTER FIX:');
    console.log('   Root opacity:', rootStyle.opacity);
    console.log('   Root pointer-events:', rootStyle.pointerEvents);
    console.log('   Body opacity:', bodyStyle.opacity);
    console.log('   Body pointer-events:', bodyStyle.pointerEvents);
    console.log('   Body overflow:', bodyStyle.overflow);
    
    if (parseFloat(rootStyle.opacity) < 1 || rootStyle.pointerEvents === 'none') {
      console.error('❌ Root is still blocked! This is very unusual.');
      console.error('   Try: location.reload(true)');
    } else {
      console.log('✅ Everything should be visible and clickable now!');
      console.log('🧪 Try clicking anywhere on the page.');
    }
  }, 100);
  
  console.log('✅ Nuclear fix applied!');
  console.log('⏳ Checking results in 100ms...');
})();

