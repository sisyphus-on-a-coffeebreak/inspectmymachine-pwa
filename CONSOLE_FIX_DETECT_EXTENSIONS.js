// ============================================
// DETECT EXTENSION INTERFERENCE
// Identifies signs of browser extensions interfering
// ============================================

(function() {
  console.log('🔍 Detecting extension interference...');
  console.log('');
  
  const findings = [];
  
  // 1. Check for extension-injected scripts
  console.log('1️⃣ Checking for extension-injected scripts...');
  const scripts = Array.from(document.scripts);
  const extensionScripts = scripts.filter(script => {
    const src = script.src || '';
    return src.includes('extension://') || 
           src.includes('chrome-extension://') || 
           src.includes('moz-extension://') ||
           script.id?.includes('extension') ||
           script.className?.includes('extension');
  });
  
  if (extensionScripts.length > 0) {
    console.warn(`   ⚠️ Found ${extensionScripts.length} extension-injected scripts:`);
    extensionScripts.forEach((script, i) => {
      const src = script.src || 'inline';
      const id = script.id || 'no-id';
      console.warn(`      ${i + 1}. ${id} - ${src.substring(0, 100)}`);
      findings.push({ type: 'script', element: script, src, id });
    });
  } else {
    console.log('   ✅ No obvious extension scripts detected');
  }
  
  // 2. Check for extension-injected styles
  console.log('\n2️⃣ Checking for extension-injected styles...');
  const styles = Array.from(document.styleSheets);
  const extensionStyles = [];
  
  styles.forEach((sheet, i) => {
    try {
      const href = sheet.href || '';
      const ownerNode = sheet.ownerNode;
      if (ownerNode) {
        const id = ownerNode.id || '';
        const className = ownerNode.className || '';
        
        if (href.includes('extension://') || 
            href.includes('chrome-extension://') || 
            href.includes('moz-extension://') ||
            id.includes('extension') ||
            className.includes('extension')) {
          extensionStyles.push({ sheet, href, id, className });
        }
      }
    } catch (e) {
      // Cross-origin stylesheets throw errors, ignore
    }
  });
  
  if (extensionStyles.length > 0) {
    console.warn(`   ⚠️ Found ${extensionStyles.length} extension-injected stylesheets:`);
    extensionStyles.forEach((item, i) => {
      console.warn(`      ${i + 1}. ${item.id || 'no-id'} - ${item.href || 'inline'}`);
      findings.push({ type: 'stylesheet', ...item });
    });
  } else {
    console.log('   ✅ No obvious extension stylesheets detected');
  }
  
  // 3. Check for extension-injected DOM elements
  console.log('\n3️⃣ Checking for extension-injected DOM elements...');
  const extensionElements = [];
  
  // Common extension element patterns
  const extensionSelectors = [
    '[id*="extension"]',
    '[class*="extension"]',
    '[id*="adblock"]',
    '[id*="ublock"]',
    '[id*="ghostery"]',
    '[id*="privacy"]',
    '[id*="noscript"]',
    '[class*="adblock"]',
    '[class*="ublock"]',
    'iframe[src*="extension://"]',
    'iframe[src*="chrome-extension://"]',
    'div[id^="__"]', // Common pattern for extension overlays
  ];
  
  extensionSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach(el => {
          extensionElements.push({
            tag: el.tagName,
            id: el.id,
            classes: el.className,
            selector
          });
        });
      }
    } catch (e) {
      // Invalid selector, skip
    }
  });
  
  if (extensionElements.length > 0) {
    console.warn(`   ⚠️ Found ${extensionElements.length} potential extension elements:`);
    extensionElements.slice(0, 10).forEach((item, i) => {
      console.warn(`      ${i + 1}. ${item.tag} (id: ${item.id || 'none'}, classes: ${item.classes || 'none'})`);
      findings.push({ type: 'element', ...item });
    });
    if (extensionElements.length > 10) {
      console.warn(`      ... and ${extensionElements.length - 10} more`);
    }
  } else {
    console.log('   ✅ No obvious extension elements detected');
  }
  
  // 4. Check for modified event listeners (extensions often add listeners)
  console.log('\n4️⃣ Checking for event listener interference...');
  let listenerCount = 0;
  const testElement = document.body;
  
  // Try to detect if preventDefault is being called
  const originalPreventDefault = Event.prototype.preventDefault;
  let preventDefaultCalled = false;
  
  Event.prototype.preventDefault = function() {
    preventDefaultCalled = true;
    return originalPreventDefault.call(this);
  };
  
  // Test a click event
  const testEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
  testElement.dispatchEvent(testEvent);
  
  if (preventDefaultCalled) {
    console.warn('   ⚠️ preventDefault was called on test event - something is blocking events');
    findings.push({ type: 'event-blocking', detected: true });
  } else {
    console.log('   ✅ No obvious event blocking detected');
  }
  
  // Restore original
  Event.prototype.preventDefault = originalPreventDefault;
  
  // 5. Check for global variables added by extensions
  console.log('\n5️⃣ Checking for extension global variables...');
  const extensionGlobals = [];
  const commonExtensionVars = [
    'adblock',
    'ublock',
    'ghostery',
    'privacy',
    'noscript',
    'adguard',
    'adblockplus'
  ];
  
  commonExtensionVars.forEach(varName => {
    if (window[varName] !== undefined) {
      extensionGlobals.push(varName);
      console.warn(`   ⚠️ Found global variable: window.${varName}`);
      findings.push({ type: 'global-variable', name: varName });
    }
  });
  
  if (extensionGlobals.length === 0) {
    console.log('   ✅ No common extension globals detected');
  }
  
  // 6. Check for modified DOM methods (extensions sometimes override these)
  console.log('\n6️⃣ Checking for modified DOM methods...');
  const modifiedMethods = [];
  
  const methodsToCheck = [
    { obj: document, method: 'addEventListener' },
    { obj: document.body, method: 'addEventListener' },
    { obj: window, method: 'addEventListener' },
  ];
  
  methodsToCheck.forEach(({ obj, method }) => {
    if (obj && obj[method]) {
      const func = obj[method].toString();
      // If the function has been wrapped or modified, it might show signs
      if (func.includes('native code') === false && func.length > 100) {
        modifiedMethods.push({ obj: obj.constructor.name, method });
      }
    }
  });
  
  if (modifiedMethods.length > 0) {
    console.warn(`   ⚠️ Found ${modifiedMethods.length} potentially modified methods:`);
    modifiedMethods.forEach(item => {
      console.warn(`      - ${item.obj}.${item.method}`);
      findings.push({ type: 'modified-method', ...item });
    });
  } else {
    console.log('   ✅ No obvious method modifications detected');
  }
  
  // 7. Check for high z-index elements that might be blocking
  console.log('\n7️⃣ Checking for blocking overlays...');
  const blockingElements = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const zIndex = parseInt(style.zIndex || '0');
    const rect = el.getBoundingClientRect();
    
    if (zIndex >= 9999 && 
        rect.width >= window.innerWidth * 0.8 && 
        rect.height >= window.innerHeight * 0.8) {
      blockingElements.push({
        tag: el.tagName,
        id: el.id,
        classes: el.className,
        zIndex: zIndex,
        pointerEvents: style.pointerEvents
      });
    }
  });
  
  if (blockingElements.length > 0) {
    console.warn(`   ⚠️ Found ${blockingElements.length} high z-index blocking elements:`);
    console.table(blockingElements);
    findings.push({ type: 'blocking-overlay', elements: blockingElements });
  } else {
    console.log('   ✅ No blocking overlays detected');
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  if (findings.length === 0) {
    console.log('   ✅ No obvious extension interference detected');
    console.log('   💡 The issue might be:');
    console.log('      1. A very subtle extension modification');
    console.log('      2. Cached service worker data');
    console.log('      3. Browser settings');
    console.log('   💡 Try:');
    console.log('      - Disable all extensions manually');
    console.log('      - Clear browser cache completely');
    console.log('      - Check browser://extensions/ for installed extensions');
  } else {
    console.warn(`   ⚠️ Found ${findings.length} potential interference(s):`);
    findings.forEach((finding, i) => {
      console.warn(`      ${i + 1}. ${finding.type}`);
    });
    console.log('\n   💡 To identify the extension:');
    console.log('      1. Go to chrome://extensions/ (or browser://extensions/)');
    console.log('      2. Disable extensions one by one');
    console.log('      3. Refresh the page after each disable');
    console.log('      4. When the issue stops, you found the culprit!');
  }
  
  console.log('\n✅ Detection complete!');
})();




