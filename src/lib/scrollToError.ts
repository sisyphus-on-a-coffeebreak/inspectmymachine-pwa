/**
 * Scroll to Error Utility
 * 
 * Provides functionality to scroll to the first error in a form
 * Useful for mobile devices where errors may be hidden behind keyboard
 */

/**
 * Scroll to the first error element in a form
 * @param formElement - The form element or container
 * @param errorSelector - CSS selector for error elements (default: '[data-error], .error, [aria-invalid="true"]')
 * @param offset - Offset from top of viewport (default: 100px to account for headers)
 */
export function scrollToFirstError(
  formElement: HTMLElement | null,
  errorSelector: string = '[data-error], .error, [aria-invalid="true"]',
  offset: number = 100
): boolean {
  if (!formElement) return false;

  // Find first error element
  const firstError = formElement.querySelector(errorSelector) as HTMLElement;
  
  if (!firstError) return false;

  // Get element position
  const elementTop = firstError.getBoundingClientRect().top + window.pageYOffset;
  
  // Scroll to element with offset
  window.scrollTo({
    top: elementTop - offset,
    behavior: 'smooth'
  });

  // Focus on the error element or its associated input
  const input = firstError.querySelector('input, textarea, select') as HTMLElement;
  if (input) {
    // Small delay to ensure scroll completes
    setTimeout(() => {
      input.focus();
    }, 300);
  } else {
    // Focus on error element itself if no input found
    setTimeout(() => {
      firstError.focus();
    }, 300);
  }

  return true;
}

/**
 * React hook to scroll to first error in a form
 */
export function useScrollToError() {
  return (formId?: string, errorSelector?: string, offset?: number) => {
    const formElement = formId 
      ? document.getElementById(formId)
      : document.querySelector('form');
    
    return scrollToFirstError(formElement, errorSelector, offset);
  };
}
