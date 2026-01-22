// ============================================
// DARK THEME OVERRIDE FIX
// The dark theme is overriding the login page background
// Run this to force the light background
// ============================================

(function() {
  console.log('🔧 Fixing dark theme override...');
  
  // 1. Temporarily remove dark class from HTML
  const html = document.documentElement;
  const hadDarkClass = html.classList.contains('dark');
  if (hadDarkClass) {
    html.classList.remove('dark');
    console.log('✅ Removed dark class from HTML');
  }
  
  // 2. Force body background to light
  document.body.style.setProperty('background', '#f9fafb', 'important');
  document.body.style.setProperty('background-color', '#f9fafb', 'important');
  
  // 3. Force root background
  const root = document.getElementById('root');
  if (root) {
    root.style.setProperty('background', '#f9fafb', 'important');
    root.style.setProperty('background-color', '#f9fafb', 'important');
  }
  
  // 4. Force main container background with !important
  const mainContainer = root?.firstElementChild;
  if (mainContainer) {
    // Remove any existing background styles
    mainContainer.style.removeProperty('background');
    mainContainer.style.removeProperty('background-color');
    
    // Set with !important using setProperty
    mainContainer.style.setProperty('background', 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', 'important');
    mainContainer.style.setProperty('background-color', '#f9fafb', 'important');
    mainContainer.style.setProperty('opacity', '1', 'important');
    mainContainer.style.setProperty('pointer-events', 'auto', 'important');
    
    console.log('✅ Main container background forced');
    
    // Verify
    const computed = window.getComputedStyle(mainContainer);
    console.log('   Computed background:', computed.backgroundColor);
    console.log('   Computed background-image:', computed.backgroundImage);
  }
  
  // 5. Add a style tag to override dark theme CSS
  const styleId = 'force-light-theme-override';
  let overrideStyle = document.getElementById(styleId);
  if (!overrideStyle) {
    overrideStyle = document.createElement('style');
    overrideStyle.id = styleId;
    overrideStyle.textContent = `
      body {
        background: #f9fafb !important;
        background-color: #f9fafb !important;
      }
      #root > div:first-child {
        background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%) !important;
        background-color: #f9fafb !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(overrideStyle);
    console.log('✅ Added CSS override style');
  }
  
  console.log('✅ Dark theme override fix complete!');
  console.log('🧪 The login page should now have a light background and be clickable.');
  console.log('💡 Note: Dark class was removed. You can add it back later if needed.');
})();

