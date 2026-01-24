// ============================================
// EMERGENCY FIX - Run this RIGHT NOW
// Paste this entire block in console and press Enter
// ============================================

// Remove all overlays
document.querySelectorAll('[role="dialog"], [aria-modal="true"], .bottom-sheet-backdrop, .bottom-sheet').forEach(el => el.remove());
document.querySelectorAll('*').forEach(el => {
  const s = window.getComputedStyle(el);
  if (s.position === 'fixed' && parseInt(s.zIndex || '0') >= 99 && !el.getAttribute('aria-label')?.includes('Emergency')) {
    el.remove();
  }
});

// FORCE unlock body (this is the key fix!)
document.body.style.setProperty('overflow', 'auto', 'important');
document.body.style.setProperty('position', '', 'important');
document.body.style.setProperty('width', '', 'important');
document.body.style.setProperty('height', '', 'important');
document.body.style.setProperty('pointer-events', 'auto', 'important');
document.body.removeAttribute('style');
document.body.style.overflow = 'auto';
document.body.style.position = '';
document.documentElement.style.overflow = '';
document.documentElement.style.position = '';

console.log('✅ Emergency fix applied! Try clicking now.');



