// ============================================
// DEEP DIAGNOSTIC - Finds hidden blockers
// Run this to see what's REALLY blocking
// ============================================

(function() {
  console.log('🔬 DEEP DIAGNOSTIC - Finding hidden blockers...');
  
  // Check 1: Pseudo-elements (::before, ::after)
  console.log('\n1️⃣ Checking pseudo-elements...');
  const bodyBefore = window.getComputedStyle(document.body, '::before');
  const bodyAfter = window.getComputedStyle(document.body, '::after');
  const htmlBefore = window.getComputedStyle(document.documentElement, '::before');
  const htmlAfter = window.getComputedStyle(document.documentElement, '::after');
  
  if (bodyBefore.content !== 'none' && bodyBefore.content !== '') {
    console.warn('   ⚠️ Body has ::before pseudo-element!');
    console.log('      Content:', bodyBefore.content);
    console.log('      Position:', bodyBefore.position);
    console.log('      Z-index:', bodyBefore.zIndex);
    console.log('      Background:', bodyBefore.backgroundColor);
  }
  if (bodyAfter.content !== 'none' && bodyAfter.content !== '') {
    console.warn('   ⚠️ Body has ::after pseudo-element!');
    console.log('      Content:', bodyAfter.content);
    console.log('      Position:', bodyAfter.position);
  }
  if (htmlBefore.content !== 'none' && htmlBefore.content !== '') {
    console.warn('   ⚠️ HTML has ::before pseudo-element!');
  }
  if (htmlAfter.content !== 'none' && htmlAfter.content !== '') {
    console.warn('   ⚠️ HTML has ::after pseudo-element!');
  }
  
  // Check 2: Elements with backdrop-filter (often invisible overlays)
  console.log('\n2️⃣ Checking elements with backdrop-filter...');
  const backdropElements = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.backdropFilter && style.backdropFilter !== 'none') {
      const rect = el.getBoundingClientRect();
      backdropElements.push({
        element: el,
        tag: el.tagName,
        id: el.id,
        classes: el.className,
        backdropFilter: style.backdropFilter,
        position: style.position,
        zIndex: style.zIndex,
        coversScreen: rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9,
        pointerEvents: style.pointerEvents
      });
    }
  });
  if (backdropElements.length > 0) {
    console.warn('   ⚠️ Found ' + backdropElements.length + ' elements with backdrop-filter:');
    console.table(backdropElements);
  } else {
    console.log('   ✅ No backdrop-filter elements found');
  }
  
  // Check 3: Elements covering the entire viewport (regardless of position)
  console.log('\n3️⃣ Checking elements covering viewport...');
  const viewportCoverers = [];
  document.querySelectorAll('*').forEach(el => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    const coversWidth = rect.width >= window.innerWidth * 0.95;
    const coversHeight = rect.height >= window.innerHeight * 0.95;
    const coversViewport = coversWidth && coversHeight;
    
    if (coversViewport && style.pointerEvents !== 'none') {
      viewportCoverers.push({
        element: el,
        tag: el.tagName,
        id: el.id,
        classes: el.className,
        position: style.position,
        zIndex: style.zIndex,
        backgroundColor: style.backgroundColor,
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        display: style.display,
        visibility: style.visibility,
        width: rect.width,
        height: rect.height
      });
    }
  });
  if (viewportCoverers.length > 0) {
    console.warn('   ⚠️ Found ' + viewportCoverers.length + ' elements covering viewport:');
    console.table(viewportCoverers);
    // Highlight them
    viewportCoverers.forEach(item => {
      item.element.style.border = '5px solid red';
      console.log('   🔴 Highlighted:', item.tag, 'z-index:', item.zIndex);
    });
  } else {
    console.log('   ✅ No viewport-covering elements found');
  }
  
  // Check 4: Elements with pointer-events: auto that might block
  console.log('\n4️⃣ Checking elements with pointer-events that might block...');
  const pointerBlockers = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (style.pointerEvents === 'auto' && 
        rect.width >= window.innerWidth * 0.8 && 
        rect.height >= window.innerHeight * 0.8 &&
        (parseInt(style.zIndex || '0') >= 99 || style.position === 'fixed' || style.position === 'absolute')) {
      pointerBlockers.push({
        element: el,
        tag: el.tagName,
        zIndex: style.zIndex,
        position: style.position,
        backgroundColor: style.backgroundColor,
        opacity: style.opacity
      });
    }
  });
  if (pointerBlockers.length > 0) {
    console.warn('   ⚠️ Found ' + pointerBlockers.length + ' potential pointer blockers:');
    console.table(pointerBlockers);
  }
  
  // Check 5: React root and portals
  console.log('\n5️⃣ Checking React structure...');
  const root = document.getElementById('root');
  if (root) {
    const rootStyle = window.getComputedStyle(root);
    console.log('   Root element:');
    console.log('      Position:', rootStyle.position);
    console.log('      Z-index:', rootStyle.zIndex);
    console.log('      Pointer-events:', rootStyle.pointerEvents);
    console.log('      Opacity:', rootStyle.opacity);
    console.log('      Visibility:', rootStyle.visibility);
    
    if (rootStyle.pointerEvents === 'none' || rootStyle.opacity === '0' || rootStyle.visibility === 'hidden') {
      console.error('   ❌ ROOT IS BLOCKED! This is the problem!');
    }
  }
  
  // Check 6: Body and HTML computed styles
  console.log('\n6️⃣ Final body/html check...');
  const bodyStyle = window.getComputedStyle(document.body);
  const htmlStyle = window.getComputedStyle(document.documentElement);
  console.log('   Body:');
  console.log('      Background:', bodyStyle.backgroundColor);
  console.log('      Pointer-events:', bodyStyle.pointerEvents);
  console.log('      Opacity:', bodyStyle.opacity);
  console.log('   HTML:');
  console.log('      Background:', htmlStyle.backgroundColor);
  console.log('      Pointer-events:', htmlStyle.pointerEvents);
  
  // Check 7: All direct children of body
  console.log('\n7️⃣ Direct children of body:');
  Array.from(document.body.children).forEach((child, i) => {
    const style = window.getComputedStyle(child);
    const rect = child.getBoundingClientRect();
    console.log(`   ${i + 1}. ${child.tagName} (id: ${child.id || 'none'}, classes: ${child.className || 'none'})`);
    console.log(`      Position: ${style.position}, Z-index: ${style.zIndex}`);
    console.log(`      Size: ${rect.width}x${rect.height}, Covers: ${rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9}`);
    console.log(`      Pointer-events: ${style.pointerEvents}, Opacity: ${style.opacity}`);
  });
  
  console.log('\n✅ Diagnostic complete. Check the warnings above.');
  console.log('💡 If root has pointer-events: none, that\'s your problem!');
})();



