// ============================================
// LOGIN PAGE FIX - Forces login page visible and clickable
// Run this if you're on the login page and it's dark/unclickable
// ============================================

(function() {
  console.log('🔧 Fixing login page...');
  
  // 1. Find the login page container (the div with minHeight: 100dvh)
  const root = document.getElementById('root');
  if (!root) {
    console.error('❌ No root element');
    return;
  }
  
  // Find the main container div (first child of root)
  const mainContainer = root.firstElementChild;
  if (mainContainer && mainContainer.tagName === 'DIV') {
    const style = window.getComputedStyle(mainContainer);
    console.log('Found main container:', mainContainer);
    console.log('  Current background:', style.backgroundColor);
    console.log('  Current opacity:', style.opacity);
    console.log('  Current pointer-events:', style.pointerEvents);
    
    // Force it to be visible and clickable
    mainContainer.style.setProperty('background', 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', 'important');
    mainContainer.style.setProperty('opacity', '1', 'important');
    mainContainer.style.setProperty('pointer-events', 'auto', 'important');
    mainContainer.style.setProperty('visibility', 'visible', 'important');
    mainContainer.style.setProperty('position', 'relative', 'important');
    mainContainer.style.setProperty('z-index', '1', 'important');
    
    console.log('✅ Main container fixed');
  }
  
  // 2. Force body background to be light (temporarily)
  document.body.style.setProperty('background', '#f9fafb', 'important');
  
  // 3. Force all children to be visible
  if (mainContainer) {
    let fixed = 0;
    mainContainer.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      if (parseFloat(style.opacity) === 0 || style.visibility === 'hidden') {
        el.style.setProperty('opacity', '1', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        fixed++;
      }
      // Ensure pointer-events are auto
      if (style.pointerEvents === 'none') {
        el.style.setProperty('pointer-events', 'auto', 'important');
        fixed++;
      }
    });
    if (fixed > 0) {
      console.log(`✅ Fixed ${fixed} child elements`);
    }
  }
  
  // 4. Remove any overlays
  document.querySelectorAll('[role="dialog"], [aria-modal="true"], .bottom-sheet-backdrop').forEach(el => {
    console.log('Removing overlay:', el.tagName);
    el.remove();
  });
  
  // 5. Ensure root is visible
  root.style.setProperty('opacity', '1', 'important');
  root.style.setProperty('pointer-events', 'auto', 'important');
  
  console.log('✅ Login page fix complete!');
  console.log('🧪 Try clicking on the login form now.');
})();




