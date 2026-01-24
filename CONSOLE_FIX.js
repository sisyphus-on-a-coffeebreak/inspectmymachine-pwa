// ============================================
// EMERGENCY FIX - Paste this ENTIRE block in console
// ============================================

(function() {
  console.log('🔍 Diagnosing stuck overlay...');
  
  // Find all blocking elements
  const blockers = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed') {
      const zIndex = parseInt(style.zIndex) || 0;
      const bg = style.backgroundColor;
      const role = el.getAttribute('role');
      const display = style.display;
      const visibility = style.visibility;
      const opacity = style.opacity;
      
      if (zIndex >= 99 || role === 'dialog' || bg.includes('rgba(0')) {
        const rect = el.getBoundingClientRect();
        blockers.push({
          element: el,
          tag: el.tagName,
          id: el.id,
          classes: el.className,
          zIndex: style.zIndex,
          backgroundColor: bg,
          role: role,
          display: display,
          visibility: visibility,
          opacity: opacity,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          hasChildren: el.children.length,
          html: el.outerHTML.substring(0, 150)
        });
      }
    }
  });
  
  console.log('📊 Found ' + blockers.length + ' potential blockers:');
  console.table(blockers);
  
  // Sort by z-index and show top blocker
  blockers.sort((a, b) => {
    const aZ = parseInt(a.zIndex) || 0;
    const bZ = parseInt(b.zIndex) || 0;
    return bZ - aZ;
  });
  
  if (blockers.length > 0) {
    console.log('🎯 Top blocker:', blockers[0]);
    blockers[0].element.style.border = '10px solid red';
    blockers[0].element.style.outline = '10px solid yellow';
    console.log('   Highlighted in RED/YELLOW - check the page');
  }
  
  // FIX: Remove all blocking overlays
  console.log('🔧 Removing blocking overlays...');
  let removed = 0;
  
  blockers.forEach(blocker => {
    const el = blocker.element;
    const bg = blocker.backgroundColor;
    
    // Remove if it's a dark overlay or modal
    if (
      bg.includes('rgba(0, 0, 0') || 
      bg.includes('rgba(0,0,0') || 
      blocker.role === 'dialog' ||
      (parseInt(blocker.zIndex) >= 8000)
    ) {
      console.log('   Removing:', blocker.tag, 'z-index:', blocker.zIndex);
      el.remove();
      removed++;
    }
  });
  
  // Remove all modals
  document.querySelectorAll('[role="dialog"]').forEach(el => {
    console.log('   Removing dialog:', el);
    el.remove();
    removed++;
  });
  
  // Unlock body completely
  document.body.style.cssText = '';
  document.documentElement.style.overflow = '';
  document.body.className = '';
  document.body.classList.remove('keyboard-visible');
  
  // Remove any inline styles from html element
  document.documentElement.style.overflow = '';
  
  console.log('✅ Removed ' + removed + ' blocking elements');
  console.log('✅ Body scroll unlocked');
  console.log('✅ Page should be usable now!');
  
  // Check if still blocked
  setTimeout(() => {
    const stillBlocked = document.querySelectorAll('[style*="position: fixed"][style*="z-index"]').length;
    if (stillBlocked > 0) {
      console.warn('⚠️ Still ' + stillBlocked + ' fixed elements found. Running nuclear option...');
      document.querySelectorAll('[style*="position: fixed"]').forEach(el => {
        const z = parseInt(window.getComputedStyle(el).zIndex || '0');
        if (z >= 99) el.remove();
      });
    }
  }, 1000);
})();



