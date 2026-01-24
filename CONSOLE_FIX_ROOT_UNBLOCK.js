// ============================================
// ROOT UNBLOCK FIX - If root element is blocked
// Run this if diagnostic shows root is blocked
// ============================================

(function() {
  console.log('🔓 ROOT UNBLOCK FIX...');
  
  // Force unlock root
  const root = document.getElementById('root');
  if (root) {
    root.style.setProperty('pointer-events', 'auto', 'important');
    root.style.setProperty('opacity', '1', 'important');
    root.style.setProperty('visibility', 'visible', 'important');
    root.style.setProperty('position', '', 'important');
    root.style.setProperty('z-index', '', 'important');
    console.log('✅ Root unblocked');
  }
  
  // Also unlock body and html
  document.body.style.setProperty('pointer-events', 'auto', 'important');
  document.body.style.setProperty('opacity', '1', 'important');
  document.body.style.setProperty('visibility', 'visible', 'important');
  
  document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
  document.documentElement.style.setProperty('opacity', '1', 'important');
  document.documentElement.style.setProperty('visibility', 'visible', 'important');
  
  // Remove all overlays
  document.querySelectorAll('[role="dialog"], [aria-modal="true"], .bottom-sheet-backdrop, .bottom-sheet').forEach(el => el.remove());
  document.querySelectorAll('*').forEach(el => {
    const s = window.getComputedStyle(el);
    if (s.position === 'fixed' && parseInt(s.zIndex || '0') >= 99 && !el.getAttribute('aria-label')?.includes('Emergency')) {
      el.remove();
    }
  });
  
  // Force unlock body scroll
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('position', 'static', 'important');
  
  console.log('✅ All elements unblocked');
  console.log('🧪 Try clicking now!');
})();



