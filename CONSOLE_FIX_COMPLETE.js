// ============================================
// COMPLETE FIX - Handles all edge cases
// Paste this in console
// ============================================

(function() {
  console.log('🚨 COMPLETE EMERGENCY FIX...');
  
  let removed = 0;
  
  // 1. Remove ALL fixed elements with high z-index (except emergency button)
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed') {
      const z = parseInt(style.zIndex) || 0;
      // Remove anything with z-index >= 8000 (modals, backdrops, etc.)
      // But keep emergency button (z-index 99999 but we'll check aria-label)
      if (z >= 8000 && !el.getAttribute('aria-label')?.includes('Emergency')) {
        console.log('   Removing fixed element:', el.tagName, 'z-index:', z);
        el.remove();
        removed++;
      }
    }
  });
  
  // 2. Remove by class names
  document.querySelectorAll('.bottom-sheet-backdrop, .bottom-sheet, [role="dialog"], [aria-modal="true"]').forEach(el => {
    console.log('   Removing by class/role:', el.tagName);
    el.remove();
    removed++;
  });
  
  // 3. Remove elements with inset: 0 (full-screen overlays)
  document.querySelectorAll('[style*="inset: 0"], [style*="inset:0"], [style*="top: 0"][style*="left: 0"][style*="right: 0"][style*="bottom: 0"]').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed') {
      console.log('   Removing full-screen overlay');
      el.remove();
      removed++;
    }
  });
  
  // 4. Remove React portals (they render outside normal DOM)
  // Check for elements in #root or react portals
  const root = document.getElementById('root');
  if (root) {
    // Find all fixed elements that are children of body but not root
    document.body.childNodes.forEach(node => {
      if (node.nodeType === 1 && node !== root) { // Element node
        const style = window.getComputedStyle(node);
        if (style.position === 'fixed' && parseInt(style.zIndex || '0') >= 8000) {
          console.log('   Removing React portal/overlay:', node.tagName);
          node.remove();
          removed++;
        }
      }
    });
  }
  
  // 5. Remove pseudo-elements by removing their parent's ::before and ::after
  // We can't directly remove pseudo-elements, but we can hide them
  document.querySelectorAll('*').forEach(el => {
    const before = window.getComputedStyle(el, '::before');
    const after = window.getComputedStyle(el, '::after');
    if (before.position === 'fixed' || after.position === 'fixed') {
      el.style.setProperty('--pseudo-display', 'none');
    }
  });
  
  // 6. COMPLETELY reset body and html
  document.body.style.cssText = '';
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.height = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.className = '';
  document.body.classList.remove('keyboard-visible');
  document.body.removeAttribute('style');
  
  document.documentElement.style.cssText = '';
  document.documentElement.style.overflow = '';
  document.documentElement.style.position = '';
  
  // 7. Force remove any remaining overlays by checking computed styles
  setTimeout(() => {
    const remaining = [];
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed') {
        const rect = el.getBoundingClientRect();
        const z = parseInt(style.zIndex) || 0;
        // If it covers most of the screen and has high z-index
        if (rect.width >= window.innerWidth * 0.8 && 
            rect.height >= window.innerHeight * 0.8 && 
            z >= 99) {
          // Skip emergency button
          if (!el.getAttribute('aria-label')?.includes('Emergency')) {
            remaining.push(el);
          }
        }
      }
    });
    
    if (remaining.length > 0) {
      console.warn('⚠️ Found ' + remaining.length + ' remaining screen-covering elements:');
      remaining.forEach(el => {
        const s = window.getComputedStyle(el);
        console.log('   Force removing:', el.tagName, 'z-index:', s.zIndex, 'bg:', s.backgroundColor);
        el.style.display = 'none'; // Hide first
        setTimeout(() => el.remove(), 100); // Then remove
        removed++;
      });
    }
  }, 100);
  
  console.log('✅ Removed ' + removed + ' blocking elements');
  console.log('✅ Body and HTML completely reset');
  console.log('');
  console.log('🔍 If screen is STILL dark, check:');
  console.log('   1. Is body background dark? (Theme issue, not overlay)');
  console.log('   2. Are there React portals? (Check React DevTools)');
  console.log('   3. Try: document.body.style.backgroundColor = "white"');
  console.log('   4. Or refresh the page completely');
})();




