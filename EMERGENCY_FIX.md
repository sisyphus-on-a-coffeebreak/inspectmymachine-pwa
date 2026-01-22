# Emergency Fix for Stuck Overlay

## 🚨 IMMEDIATE FIX - Paste this in Console:

```javascript
// Remove all blocking overlays
document.querySelectorAll('*').forEach(el => {
  const style = window.getComputedStyle(el);
  if (style.position === 'fixed' && (parseInt(style.zIndex) >= 99 || style.zIndex === 'auto')) {
    const bg = style.backgroundColor;
    if (bg.includes('rgba(0, 0, 0') || bg.includes('rgba(0,0,0') || el.getAttribute('role') === 'dialog') {
      console.log('Removing overlay:', el, 'z-index:', style.zIndex, 'bg:', bg);
      el.remove();
    }
  }
});

// Unlock body
document.body.style.cssText = '';
document.documentElement.style.overflow = '';
document.body.classList.remove('keyboard-visible');

// Remove all modals
document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());

console.log('✅ Fixed!');
```

## 🔍 DIAGNOSTIC - Find what's blocking:

```javascript
// Find all fixed elements with high z-index
const blockers = [];
document.querySelectorAll('*').forEach(el => {
  const style = window.getComputedStyle(el);
  if (style.position === 'fixed') {
    const zIndex = parseInt(style.zIndex) || 0;
    const bg = style.backgroundColor;
    const role = el.getAttribute('role');
    
    if (zIndex >= 99 || role === 'dialog' || bg.includes('rgba(0')) {
      blockers.push({
        element: el,
        tag: el.tagName,
        zIndex: style.zIndex,
        backgroundColor: bg,
        role: role,
        classes: el.className,
        id: el.id,
        visible: style.display !== 'none' && style.visibility !== 'hidden',
        html: el.outerHTML.substring(0, 200)
      });
    }
  }
});

console.table(blockers);
console.log('Total blockers:', blockers.length);

// Show the top blocker
if (blockers.length > 0) {
  const topBlocker = blockers.sort((a, b) => {
    const aZ = parseInt(a.zIndex) || 0;
    const bZ = parseInt(b.zIndex) || 0;
    return bZ - aZ;
  })[0];
  console.log('Top blocker:', topBlocker);
  topBlocker.element.style.border = '5px solid red'; // Highlight it
}
```

## 🛠️ NUCLEAR OPTION - Remove everything:

```javascript
// Remove ALL fixed elements (use with caution)
document.querySelectorAll('*').forEach(el => {
  const style = window.getComputedStyle(el);
  if (style.position === 'fixed') {
    el.remove();
  }
});

// Reset body completely
document.body.style.cssText = '';
document.documentElement.style.cssText = '';
document.body.className = '';
```

