/**
 * Autocomplete Utilities
 * 
 * Provides autocomplete attribute values based on field type and label
 * Follows HTML autocomplete specification: https://html.spec.whatwg.org/multipage/forms.html#autofill
 */

export type AutocompleteValue =
  // Name fields
  | 'name'
  | 'given-name'
  | 'family-name'
  | 'additional-name'
  | 'nickname'
  // Contact fields
  | 'email'
  | 'tel'
  | 'tel-national'
  | 'tel-country-code'
  | 'url'
  // Address fields
  | 'street-address'
  | 'address-line1'
  | 'address-line2'
  | 'address-line3'
  | 'address-level1' // State/Province
  | 'address-level2' // City
  | 'address-level3' // Suburb
  | 'address-level4' // Street
  | 'postal-code'
  | 'country'
  | 'country-name'
  // Organization fields
  | 'organization'
  | 'organization-title'
  // Account fields
  | 'username'
  | 'current-password'
  | 'new-password'
  | 'one-time-code'
  // Transaction fields
  | 'transaction-amount'
  | 'currency'
  // Other
  | 'off' // Disable autocomplete
  | string; // Custom value

/**
 * Determine autocomplete value based on field type and label
 */
export function getAutocompleteValue(
  type: string,
  label: string,
  name?: string
): AutocompleteValue | undefined {
  const lowerLabel = label.toLowerCase();
  const lowerName = name?.toLowerCase() || '';

  // Email fields
  if (type === 'email' || lowerLabel.includes('email') || lowerName.includes('email')) {
    return 'email';
  }

  // Phone/Tel fields
  if (type === 'tel' || lowerLabel.includes('phone') || lowerLabel.includes('mobile') || 
      lowerLabel.includes('contact') || lowerName.includes('phone') || lowerName.includes('mobile')) {
    return 'tel';
  }

  // Password fields
  if (type === 'password') {
    if (lowerLabel.includes('new') || lowerLabel.includes('confirm') || lowerName.includes('new')) {
      return 'new-password';
    }
    return 'current-password';
  }

  // Name fields
  if (lowerLabel.includes('name')) {
    if (lowerLabel.includes('first') || lowerLabel.includes('given') || lowerName.includes('first')) {
      return 'given-name';
    }
    if (lowerLabel.includes('last') || lowerLabel.includes('family') || lowerLabel.includes('surname') || lowerName.includes('last')) {
      return 'family-name';
    }
    if (lowerLabel.includes('full') || lowerLabel.includes('complete')) {
      return 'name';
    }
    return 'name';
  }

  // Address fields
  if (lowerLabel.includes('address')) {
    if (lowerLabel.includes('line 1') || lowerLabel.includes('street') || lowerName.includes('address1')) {
      return 'address-line1';
    }
    if (lowerLabel.includes('line 2') || lowerName.includes('address2')) {
      return 'address-line2';
    }
    if (lowerLabel.includes('city') || lowerName.includes('city')) {
      return 'address-level2';
    }
    if (lowerLabel.includes('state') || lowerLabel.includes('province') || lowerName.includes('state')) {
      return 'address-level1';
    }
    if (lowerLabel.includes('zip') || lowerLabel.includes('postal') || lowerLabel.includes('pincode') || lowerName.includes('postal')) {
      return 'postal-code';
    }
    if (lowerLabel.includes('country') || lowerName.includes('country')) {
      return 'country';
    }
    return 'street-address';
  }

  // Organization fields
  if (lowerLabel.includes('company') || lowerLabel.includes('organization') || lowerLabel.includes('organisation') || 
      lowerName.includes('company') || lowerName.includes('organization')) {
    return 'organization';
  }

  // Job title
  if (lowerLabel.includes('title') || lowerLabel.includes('position') || lowerName.includes('title')) {
    return 'organization-title';
  }

  // Username
  if (lowerLabel.includes('username') || lowerLabel.includes('user name') || lowerName.includes('username')) {
    return 'username';
  }

  // OTP/Verification code
  if (lowerLabel.includes('otp') || lowerLabel.includes('verification') || lowerLabel.includes('code') || 
      lowerName.includes('otp') || lowerName.includes('code')) {
    return 'one-time-code';
  }

  // URL
  if (type === 'url' || lowerLabel.includes('url') || lowerLabel.includes('website') || lowerName.includes('url')) {
    return 'url';
  }

  // Date fields - no autocomplete needed
  if (type === 'date' || type === 'time' || type === 'datetime-local') {
    return undefined;
  }

  // Number fields - no autocomplete for generic numbers
  if (type === 'number') {
    return undefined;
  }

  // Default: no autocomplete for generic text fields
  return undefined;
}

/**
 * Get autocomplete value for a specific field context
 */
export function getAutocompleteForField(
  field: {
    type?: string;
    label?: string;
    name?: string;
    autocomplete?: string;
  }
): AutocompleteValue | undefined {
  // If autocomplete is explicitly provided, use it
  if (field.autocomplete) {
    return field.autocomplete as AutocompleteValue;
  }

  // If autocomplete is explicitly set to 'off', respect it
  if (field.autocomplete === 'off') {
    return 'off';
  }

  // Otherwise, determine from type and label
  return getAutocompleteValue(
    field.type || 'text',
    field.label || '',
    field.name
  );
}




