// Validation utilities for form fields

export const validateMobileNumber = (mobile: string): { isValid: boolean; error?: string } => {
  // Remove any non-digit characters
  const cleanMobile = mobile.replace(/\D/g, '');
  
  // Check if it's exactly 10 digits
  if (cleanMobile.length !== 10) {
    return {
      isValid: false,
      error: 'Mobile number must be exactly 10 digits'
    };
  }
  
  // Check if it's between 6000000000 and 9999999999
  const mobileNumber = parseInt(cleanMobile, 10);
  if (mobileNumber < 6000000000 || mobileNumber > 9999999999) {
    return {
      isValid: false,
      error: 'Mobile number must be between 6000000000 and 9999999999'
    };
  }
  
  return { isValid: true };
};

export const formatMobileNumber = (mobile: string): string => {
  // Remove any non-digit characters
  const cleanMobile = mobile.replace(/\D/g, '');
  
  // Limit to 10 digits
  return cleanMobile.substring(0, 10);
};

export const formatMobileDisplay = (mobile: string): string => {
  const cleanMobile = mobile.replace(/\D/g, '');
  
  if (cleanMobile.length === 0) return '';
  if (cleanMobile.length <= 3) return `+91 ${cleanMobile}`;
  if (cleanMobile.length <= 6) return `+91 ${cleanMobile.slice(0, 3)} ${cleanMobile.slice(3)}`;
  if (cleanMobile.length <= 10) return `+91 ${cleanMobile.slice(0, 3)} ${cleanMobile.slice(3, 6)} ${cleanMobile.slice(6)}`;
  
  return `+91 ${cleanMobile.slice(0, 3)} ${cleanMobile.slice(3, 6)} ${cleanMobile.slice(6, 10)}`;
};



