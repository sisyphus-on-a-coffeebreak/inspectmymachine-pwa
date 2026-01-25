// ============================================
// CHECK CONTENT - See what's actually inside root
// Run this to see if content is rendering
// ============================================

(function() {
  console.log('🔍 Checking root content...');
  
  const root = document.getElementById('root');
  if (!root) {
    console.error('❌ No root element found!');
    return;
  }
  
  // Check root's direct children
  console.log('\n1️⃣ Root direct children:');
  Array.from(root.children).forEach((child, i) => {
    const style = window.getComputedStyle(child);
    const rect = child.getBoundingClientRect();
    console.log(`   ${i + 1}. ${child.tagName} (classes: ${child.className || 'none'})`);
    console.log(`      Opacity: ${style.opacity}`);
    console.log(`      Pointer-events: ${style.pointerEvents}`);
    console.log(`      Display: ${style.display}`);
    console.log(`      Visibility: ${style.visibility}`);
    console.log(`      Size: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    console.log(`      Has text: ${child.textContent ? child.textContent.substring(0, 50) : 'none'}`);
  });
  
  // Check for invisible children
  console.log('\n2️⃣ Checking for invisible children:');
  let invisibleCount = 0;
  root.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const opacity = parseFloat(style.opacity);
    const display = style.display;
    const visibility = style.visibility;
    const rect = el.getBoundingClientRect();
    
    if (opacity === 0 || display === 'none' || visibility === 'hidden') {
      if (rect.width > 50 || rect.height > 50) {
        invisibleCount++;
        if (invisibleCount <= 5) {
          console.warn(`   ⚠️ Invisible element: ${el.tagName} (opacity: ${opacity}, display: ${display}, visibility: ${visibility})`);
        }
      }
    }
  });
  if (invisibleCount > 5) {
    console.warn(`   ⚠️ Found ${invisibleCount} invisible elements`);
  } else if (invisibleCount === 0) {
    console.log('   ✅ No invisible elements found');
  }
  
  // Check if React has rendered
  console.log('\n3️⃣ React rendering check:');
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('   ✅ React DevTools detected');
    try {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.renderers && hook.renderers.size > 0) {
        console.log(`   ✅ React is active (${hook.renderers.size} renderer(s))`);
      } else {
        console.warn('   ⚠️ React renderers not found');
      }
    } catch (e) {
      console.warn('   ⚠️ Could not access React:', e.message);
    }
  } else {
    console.warn('   ⚠️ React DevTools not available');
  }
  
  // Check for loading states
  console.log('\n4️⃣ Checking for loading states:');
  const loadingElements = root.querySelectorAll('[aria-busy="true"], .loading, .spinner, [class*="loading"], [class*="spinner"]');
  if (loadingElements.length > 0) {
    console.warn(`   ⚠️ Found ${loadingElements.length} loading indicators`);
    loadingElements.forEach((el, i) => {
      if (i < 3) {
        const style = window.getComputedStyle(el);
        console.log(`      ${i + 1}. ${el.tagName} (opacity: ${style.opacity}, display: ${style.display})`);
      }
    });
  } else {
    console.log('   ✅ No loading indicators found');
  }
  
  // Check for Suspense fallbacks
  console.log('\n5️⃣ Checking for Suspense/Skeleton:');
  const skeletons = root.querySelectorAll('[class*="skeleton"], [class*="Skeleton"]');
  if (skeletons.length > 0) {
    console.warn(`   ⚠️ Found ${skeletons.length} skeleton loaders`);
  } else {
    console.log('   ✅ No skeleton loaders');
  }
  
  // Check actual visible content
  console.log('\n6️⃣ Visible content check:');
  const visibleText = root.textContent || '';
  const visibleTextLength = visibleText.trim().length;
  console.log(`   Text content length: ${visibleTextLength} characters`);
  if (visibleTextLength > 0) {
    console.log(`   First 100 chars: ${visibleText.substring(0, 100)}`);
    console.log('   ✅ Content is present');
  } else {
    console.warn('   ⚠️ No text content found - app may not have rendered!');
  }
  
  // Check for error boundaries
  console.log('\n7️⃣ Checking for error states:');
  const errorElements = root.querySelectorAll('[class*="error"], [class*="Error"], [role="alert"]');
  if (errorElements.length > 0) {
    console.warn(`   ⚠️ Found ${errorElements.length} error elements`);
  } else {
    console.log('   ✅ No error elements');
  }
  
  console.log('\n✅ Content check complete!');
})();




