/**
 * CSS Loader Utility
 * 
 * Utility for lazy loading route-specific CSS files
 * This helps with code splitting and reducing initial CSS bundle size
 */

/**
 * Lazy load a CSS file
 * @param href - Path to CSS file
 * @returns Promise that resolves when CSS is loaded
 */
export function loadCSS(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if stylesheet is already loaded
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'all';
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
    
    document.head.appendChild(link);
  });
}

/**
 * Preload a CSS file without blocking
 * @param href - Path to CSS file
 */
export function preloadCSS(href: string): void {
  const existingPreload = document.querySelector(`link[rel="preload"][href="${href}"]`);
  if (existingPreload) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Remove a CSS file from the document
 * @param href - Path to CSS file to remove
 */
export function unloadCSS(href: string): void {
  const link = document.querySelector(`link[href="${href}"]`);
  if (link) {
    link.remove();
  }
}


