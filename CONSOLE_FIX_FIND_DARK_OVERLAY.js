// ============================================
// FIND DARK OVERLAY - Checks for dark backgrounds covering screen
// Run this to find what's making the screen dark
// ============================================

(function() {
  console.log('🔍 Finding dark overlay...');
  
  // Find all elements with dark backgrounds that cover the screen
  const darkCoverers = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const bg = style.backgroundColor;
    const opacity = parseFloat(style.opacity);
    const zIndex = parseInt(style.zIndex || '0');
    const position = style.position;
    
    // Check if it covers most of the screen
    const coversWidth = rect.width >= window.innerWidth * 0.8;
    const coversHeight = rect.height >= window.innerHeight * 0.8;
    const coversScreen = coversWidth && coversHeight;
    
    // Check if background is dark
    const isDark = bg.includes('rgb(9, 9, 11)') || 
                   bg.includes('rgba(0, 0, 0') || 
                   bg.includes('rgba(0,0,0') ||
                   bg === 'rgb(9, 9, 11)' ||
                   bg === '#09090b';
    
    if (coversScreen && (isDark || zIndex > 0 || position === 'fixed' || position === 'absolute')) {
      darkCoverers.push({
        element: el,
        tag: el.tagName,
        id: el.id || 'none',
        classes: el.className.substring(0, 50) || 'none',
        backgroundColor: bg,
        opacity: opacity,
        zIndex: zIndex,
        position: position,
        pointerEvents: style.pointerEvents,
        size: Math.round(rect.width) + 'x' + Math.round(rect.height),
        coversScreen: coversScreen
      });
    }
  });
  
  if (darkCoverers.length > 0) {
    console.warn('⚠️ Found ' + darkCoverers.length + ' dark elements covering screen:');
    console.table(darkCoverers);
    
    // Highlight them
    darkCoverers.forEach((item, i) => {
      item.element.style.border = '5px solid ' + (i === 0 ? 'red' : 'orange');
      console.log(`   ${i === 0 ? '🔴' : '🟠'} Highlighted: ${item.tag} (z-index: ${item.zIndex}, bg: ${item.backgroundColor})`);
    });
    
    // Check if any have pointer-events that might block
    const blockers = darkCoverers.filter(item => item.pointerEvents === 'auto' && item.zIndex > 0);
    if (blockers.length > 0) {
      console.warn('   ⚠️ These might be blocking clicks:');
      blockers.forEach(item => {
        console.warn(`      - ${item.tag} (z-index: ${item.zIndex})`);
      });
    }
  } else {
    console.log('✅ No dark overlays found');
  }
  
  // Also check for elements with high z-index regardless of background
  console.log('\n🔍 Checking high z-index elements:');
  const highZIndex = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const zIndex = parseInt(style.zIndex || '0');
    const rect = el.getBoundingClientRect();
    
    if (zIndex >= 100 && rect.width >= window.innerWidth * 0.5 && rect.height >= window.innerHeight * 0.5) {
      highZIndex.push({
        element: el,
        tag: el.tagName,
        zIndex: zIndex,
        position: style.position,
        pointerEvents: style.pointerEvents,
        backgroundColor: style.backgroundColor,
        opacity: style.opacity
      });
    }
  });
  
  if (highZIndex.length > 0) {
    console.warn('   ⚠️ Found ' + highZIndex.length + ' high z-index elements:');
    console.table(highZIndex);
  } else {
    console.log('   ✅ No high z-index blockers');
  }
  
  console.log('\n✅ Dark overlay check complete!');
})();



