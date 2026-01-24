// ============================================
// FINAL DIAGNOSTIC - Checks everything
// Run this to find the exact blocker
// ============================================

(function() {
  console.log('🔬 FINAL COMPREHENSIVE DIAGNOSTIC...');
  console.log('');
  
  // 1. Check body and html computed styles
  console.log('1️⃣ Body and HTML styles:');
  const bodyStyle = window.getComputedStyle(document.body);
  const htmlStyle = window.getComputedStyle(document.documentElement);
  console.log('   Body:');
  console.log('      Background:', bodyStyle.backgroundColor);
  console.log('      Opacity:', bodyStyle.opacity);
  console.log('      Pointer-events:', bodyStyle.pointerEvents);
  console.log('      Position:', bodyStyle.position);
  console.log('      Overflow:', bodyStyle.overflow);
  console.log('      Classes:', document.body.className);
  console.log('   HTML:');
  console.log('      Background:', htmlStyle.backgroundColor);
  console.log('      Opacity:', htmlStyle.opacity);
  console.log('      Pointer-events:', htmlStyle.pointerEvents);
  console.log('      Classes:', document.documentElement.className);
  
  // 2. Check root element
  console.log('\n2️⃣ Root element:');
  const root = document.getElementById('root');
  if (root) {
    const rootStyle = window.getComputedStyle(root);
    console.log('   Opacity:', rootStyle.opacity);
    console.log('   Pointer-events:', rootStyle.pointerEvents);
    console.log('   Visibility:', rootStyle.visibility);
    console.log('   Display:', rootStyle.display);
    console.log('   Position:', rootStyle.position);
    console.log('   Z-index:', rootStyle.zIndex);
    console.log('   Background:', rootStyle.backgroundColor);
    console.log('   Classes:', root.className);
    
    // Check if root is actually visible
    const rect = root.getBoundingClientRect();
    console.log('   Size:', Math.round(rect.width) + 'x' + Math.round(rect.height));
    console.log('   Visible:', rect.width > 0 && rect.height > 0);
  }
  
  // 3. Check for pseudo-elements on body/html
  console.log('\n3️⃣ Pseudo-elements:');
  try {
    const bodyBefore = window.getComputedStyle(document.body, '::before');
    const bodyAfter = window.getComputedStyle(document.body, '::after');
    const htmlBefore = window.getComputedStyle(document.documentElement, '::before');
    const htmlAfter = window.getComputedStyle(document.documentElement, '::after');
    
    if (bodyBefore.content !== 'none' && bodyBefore.content !== '') {
      console.warn('   ⚠️ Body has ::before:', bodyBefore.content);
      console.log('      Position:', bodyBefore.position, 'Z-index:', bodyBefore.zIndex);
    }
    if (bodyAfter.content !== 'none' && bodyAfter.content !== '') {
      console.warn('   ⚠️ Body has ::after:', bodyAfter.content);
    }
    if (htmlBefore.content !== 'none' && htmlBefore.content !== '') {
      console.warn('   ⚠️ HTML has ::before:', htmlBefore.content);
    }
    if (htmlAfter.content !== 'none' && htmlAfter.content !== '') {
      console.warn('   ⚠️ HTML has ::after:', htmlAfter.content);
    }
    if (bodyBefore.content === 'none' && bodyAfter.content === 'none' && 
        htmlBefore.content === 'none' && htmlAfter.content === 'none') {
      console.log('   ✅ No pseudo-elements found');
    }
  } catch (e) {
    console.log('   ⚠️ Could not check pseudo-elements:', e.message);
  }
  
  // 4. Check for backdrop-filter elements
  console.log('\n4️⃣ Backdrop-filter elements:');
  const backdropElements = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.backdropFilter && style.backdropFilter !== 'none') {
      const rect = el.getBoundingClientRect();
      backdropElements.push({
        tag: el.tagName,
        id: el.id,
        classes: el.className.substring(0, 50),
        backdropFilter: style.backdropFilter,
        position: style.position,
        zIndex: style.zIndex,
        size: Math.round(rect.width) + 'x' + Math.round(rect.height),
        coversScreen: rect.width >= window.innerWidth * 0.9
      });
    }
  });
  if (backdropElements.length > 0) {
    console.warn('   ⚠️ Found ' + backdropElements.length + ' backdrop-filter elements:');
    console.table(backdropElements);
  } else {
    console.log('   ✅ No backdrop-filter elements');
  }
  
  // 5. Check all direct children of body
  console.log('\n5️⃣ Direct children of body:');
  Array.from(document.body.children).forEach((child, i) => {
    const style = window.getComputedStyle(child);
    const rect = child.getBoundingClientRect();
    console.log(`   ${i + 1}. ${child.tagName} (id: ${child.id || 'none'})`);
    console.log(`      Opacity: ${style.opacity}, Pointer-events: ${style.pointerEvents}`);
    console.log(`      Position: ${style.position}, Z-index: ${style.zIndex}`);
    console.log(`      Size: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    console.log(`      Covers screen: ${rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9}`);
  });
  
  // 6. Check for any element covering the entire viewport
  console.log('\n6️⃣ Elements covering entire viewport:');
  const viewportCoverers = [];
  document.querySelectorAll('*').forEach(el => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    const coversWidth = rect.width >= window.innerWidth * 0.95;
    const coversHeight = rect.height >= window.innerHeight * 0.95;
    
    if (coversWidth && coversHeight) {
      viewportCoverers.push({
        element: el,
        tag: el.tagName,
        id: el.id || 'none',
        classes: el.className.substring(0, 30) || 'none',
        position: style.position,
        zIndex: style.zIndex,
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        backgroundColor: style.backgroundColor,
        backdropFilter: style.backdropFilter !== 'none' ? style.backdropFilter : 'none'
      });
    }
  });
  if (viewportCoverers.length > 0) {
    console.warn('   ⚠️ Found ' + viewportCoverers.length + ' elements covering viewport:');
    console.table(viewportCoverers);
    // Highlight them
    viewportCoverers.forEach(item => {
      item.element.style.border = '5px solid red';
      console.log('   🔴 Highlighted:', item.tag);
    });
  } else {
    console.log('   ✅ No viewport-covering elements');
  }
  
  // 7. Check for CSS classes that might be blocking
  console.log('\n7️⃣ Potentially blocking CSS classes:');
  const blockingClasses = ['overflow-hidden', 'modal-open', 'bottom-sheet-open', 'keyboard-visible'];
  blockingClasses.forEach(className => {
    if (document.body.classList.contains(className)) {
      console.warn(`   ⚠️ Body has class: ${className}`);
    }
    if (document.documentElement.classList.contains(className)) {
      console.warn(`   ⚠️ HTML has class: ${className}`);
    }
  });
  
  // 8. Test if clicks are actually being blocked
  console.log('\n8️⃣ Testing click blocking:');
  let clickBlocked = false;
  const testClick = (e) => {
    clickBlocked = true;
    console.warn('   ⚠️ Click was blocked/prevented!');
    e.stopPropagation();
  };
  document.addEventListener('click', testClick, { capture: true, once: true });
  console.log('   Added test click listener. Try clicking anywhere...');
  setTimeout(() => {
    if (!clickBlocked) {
      console.log('   ✅ Clicks are NOT being blocked by event listeners');
    }
    document.removeEventListener('click', testClick, { capture: true });
  }, 3000);
  
  console.log('\n✅ Diagnostic complete!');
  console.log('💡 Check the warnings above to identify the blocker.');
})();



