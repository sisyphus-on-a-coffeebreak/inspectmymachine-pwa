// ============================================
// PAGE TRANSITION FIX - If PageTransition is stuck
// Run this to force visibility
// ============================================

(function() {
  console.log('🔍 Checking for PageTransition opacity issues...');
  
  // Find all elements with opacity: 0 that might be blocking
  const invisibleElements = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const opacity = parseFloat(style.opacity);
    const rect = el.getBoundingClientRect();
    
    // If element has opacity 0 and covers most of the screen
    if (opacity === 0 && 
        rect.width >= window.innerWidth * 0.8 && 
        rect.height >= window.innerHeight * 0.8) {
      invisibleElements.push({
        element: el,
        tag: el.tagName,
        id: el.id,
        classes: el.className,
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        transform: style.transform,
        transition: style.transition
      });
    }
  });
  
  if (invisibleElements.length > 0) {
    console.warn('⚠️ Found ' + invisibleElements.length + ' invisible elements covering screen:');
    console.table(invisibleElements);
    
    // Fix them
    invisibleElements.forEach(item => {
      console.log('   Fixing:', item.tag);
      item.element.style.setProperty('opacity', '1', 'important');
      item.element.style.setProperty('pointer-events', 'auto', 'important');
      item.element.style.setProperty('visibility', 'visible', 'important');
    });
    
    console.log('✅ Fixed invisible elements');
  } else {
    console.log('✅ No invisible blocking elements found');
  }
  
  // Also check root element
  const root = document.getElementById('root');
  if (root) {
    const rootStyle = window.getComputedStyle(root);
    if (parseFloat(rootStyle.opacity) < 1) {
      console.warn('⚠️ Root element has opacity < 1:', rootStyle.opacity);
      root.style.setProperty('opacity', '1', 'important');
      root.style.setProperty('visibility', 'visible', 'important');
      console.log('✅ Root element fixed');
    }
  }
  
  // Check all children of root for opacity issues
  if (root) {
    let fixed = 0;
    root.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      if (parseFloat(style.opacity) === 0 && style.pointerEvents !== 'none') {
        const rect = el.getBoundingClientRect();
        // If it's a large element, it might be blocking
        if (rect.width >= window.innerWidth * 0.5 && rect.height >= window.innerHeight * 0.5) {
          el.style.setProperty('opacity', '1', 'important');
          fixed++;
        }
      }
    });
    if (fixed > 0) {
      console.log('✅ Fixed ' + fixed + ' child elements with opacity 0');
    }
  }
  
  console.log('✅ PageTransition fix complete. Try clicking now!');
})();



