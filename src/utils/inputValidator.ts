/**
 * Input Validator Service
 * Validates user inputs with helpful error messages
 */

export interface ValidationResult {
  valid: boolean;
  message?: string;
  field?: string;
}

class InputValidator {
  /**
   * Validate email format
   */
  validateEmail(email: string): ValidationResult {
    if (!email || email.trim() === '') {
      return { valid: false, message: 'Email address is required', field: 'email' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Please enter a valid email address (e.g., user@example.com)', field: 'email' };
    }

    return { valid: true };
  }

  /**
   * Validate URL format
   */
  validateURL(url: string, fieldName: string = 'URL'): ValidationResult {
    if (!url || url.trim() === '') {
      return { valid: false, message: `${fieldName} is required`, field: 'url' };
    }

    try {
      // Allow URLs with or without protocol
      const urlToTest = url.startsWith('http://') || url.startsWith('https://') 
        ? url 
        : `https://${url}`;
      new URL(urlToTest);
      return { valid: true };
    } catch {
      return { 
        valid: false, 
        message: `Please enter a valid ${fieldName.toLowerCase()} (e.g., example.com or https://example.com)`, 
        field: 'url' 
      };
    }
  }

  /**
   * Validate keywords input
   */
  validateKeywords(keywords: string, min: number = 1, max: number = 100): ValidationResult {
    if (!keywords || keywords.trim() === '') {
      return { valid: false, message: 'Please enter at least one keyword', field: 'keywords' };
    }

    const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    if (keywordList.length < min) {
      return { valid: false, message: `Please enter at least ${min} keyword${min > 1 ? 's' : ''}`, field: 'keywords' };
    }

    if (keywordList.length > max) {
      return { 
        valid: false, 
        message: `Too many keywords. Maximum ${max} keywords allowed per request. Please split into multiple requests.`, 
        field: 'keywords' 
      };
    }

    // Check for suspicious patterns (potential abuse)
    const suspiciousPatterns = [
      /^[a-z0-9]+$/i, // All same pattern
    ];

    const allSamePattern = keywordList.every(k => suspiciousPatterns[0].test(k) && k.length < 3);
    if (allSamePattern && keywordList.length > 50) {
      return {
        valid: false,
        message: 'Suspicious keyword pattern detected. Please use meaningful keywords to prevent platform abuse.',
        field: 'keywords',
      };
    }

    return { valid: true };
  }

  /**
   * Validate file size
   */
  validateFileSize(file: File, maxSizeMB: number = 10): ValidationResult {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        message: `File size exceeds limit. Maximum ${maxSizeMB}MB allowed. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        field: 'file',
      };
    }

    return { valid: true };
  }

  /**
   * Validate CSV row count
   */
  validateCSVRowCount(rowCount: number, maxRows: number = 10000): ValidationResult {
    if (rowCount > maxRows) {
      return {
        valid: false,
        message: `CSV file too large. Maximum ${maxRows.toLocaleString()} rows allowed. Your file has ${rowCount.toLocaleString()} rows. Please split into smaller files.`,
        field: 'csv',
      };
    }

    return { valid: true };
  }

  /**
   * Validate phone number
   */
  validatePhone(phone: string): ValidationResult {
    if (!phone || phone.trim() === '') {
      return { valid: false, message: 'Phone number is required', field: 'phone' };
    }

    // Basic phone validation (allows various formats)
    const phoneRegex = /^[\d\s()+-]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
      return { 
        valid: false, 
        message: 'Please enter a valid phone number (e.g., (555) 123-4567 or +1 555 123 4567)', 
        field: 'phone' 
      };
    }

    return { valid: true };
  }

  /**
   * Validate required field
   */
  validateRequired(value: any, fieldName: string): ValidationResult {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { valid: false, message: `${fieldName} is required`, field: fieldName.toLowerCase() };
    }

    return { valid: true };
  }

  /**
   * Validate text length
   */
  validateLength(text: string, min: number, max: number, fieldName: string): ValidationResult {
    if (!text) {
      return { valid: false, message: `${fieldName} is required`, field: fieldName.toLowerCase() };
    }

    if (text.length < min) {
      return { valid: false, message: `${fieldName} must be at least ${min} characters`, field: fieldName.toLowerCase() };
    }

    if (text.length > max) {
      return { valid: false, message: `${fieldName} must be no more than ${max} characters`, field: fieldName.toLowerCase() };
    }

    return { valid: true };
  }
}

export const inputValidator = new InputValidator();

