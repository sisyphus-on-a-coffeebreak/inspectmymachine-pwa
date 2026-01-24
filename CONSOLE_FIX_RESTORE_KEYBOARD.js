// ============================================
// RESTORE KEYBOARD SHORTCUTS
// Run this to restore Cmd+Shift+R and other shortcuts
// ============================================

(function() {
  console.log('🔧 Restoring keyboard shortcuts...');
  
  // 1. Remove ALL overlays that might be blocking
  console.log('1️⃣ Removing blocking overlays...');
  let removed = 0;
  document.querySelectorAll('[role="dialog"], [aria-modal="true"], .bottom-sheet-backdrop, .bottom-sheet').forEach(el => {
    el.remove();
    removed++;
  });
  
  // Remove any fixed elements with high z-index
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' && parseInt(style.zIndex || '0') >= 99 && !el.getAttribute('aria-label')?.includes('Emergency')) {
      el.remove();
      removed++;
    }
  });
  console.log(`   Removed ${removed} blocking elements`);
  
  // 2. Force unlock body completely
  console.log('2️⃣ Unlocking body...');
  document.body.style.cssText = '';
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('position', 'static', 'important');
  document.body.style.setProperty('pointer-events', 'auto', 'important');
  document.body.style.setProperty('width', 'auto', 'important');
  document.body.style.setProperty('height', 'auto', 'important');
  document.body.classList.remove('keyboard-visible', 'modal-open', 'bottom-sheet-open');
  
  // 3. Ensure root is clickable
  const root = document.getElementById('root');
  if (root) {
    root.style.setProperty('pointer-events', 'auto', 'important');
    root.style.setProperty('opacity', '1', 'important');
  }
  
  // 4. Remove the CSS override style if it exists
  const overrideStyle = document.getElementById('force-light-theme-override');
  if (overrideStyle) {
    console.log('3️⃣ Removing CSS override style...');
    overrideStyle.remove();
  }
  
  // 5. Test keyboard shortcut
  console.log('4️⃣ Testing keyboard shortcuts...');
  const testHandler = (e) => {
    if (e.metaKey && e.shiftKey && e.key === 'R') {
      console.log('✅ Cmd+Shift+R detected! Shortcuts are working.');
      // Don't prevent default - let browser handle it
    }
  };
  document.addEventListener('keydown', testHandler, { capture: true, once: true });
  
  // 6. Check for any elements that might be blocking
  const blockers = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (style.position === 'fixed' && 
        rect.width >= window.innerWidth * 0.9 && 
        rect.height >= window.innerHeight * 0.9 &&
        parseInt(style.zIndex || '0') >= 99) {
      blockers.push({
        tag: el.tagName,
        zIndex: style.zIndex,
        pointerEvents: style.pointerEvents
      });
    }
  });
  
  if (blockers.length > 0) {
    console.warn('5️⃣ ⚠️ Still found blocking elements:');
    console.table(blockers);
    blockers.forEach(item => {
      console.warn(`   Removing: ${item.tag} (z-index: ${item.zIndex})`);
      document.querySelectorAll(item.tag).forEach(el => {
        const s = window.getComputedStyle(el);
        if (s.position === 'fixed' && parseInt(s.zIndex || '0') >= 99) {
          el.remove();
        }
      });
    });
  } else {
    console.log('5️⃣ ✅ No blocking elements found');
  }
  
  console.log('\n✅ Keyboard shortcuts should be restored!');
  console.log('🧪 Try Cmd+Shift+R now. If you see the log message above, shortcuts are working.');
  console.log('💡 If it still doesn\'t work, try:');
  console.log('   1. Close and reopen the browser tab');
  console.log('   2. Check browser extensions');
  console.log('   3. Try in incognito mode');
})();



