/**
 * OCR Service using Tesseract.js
 * 
 * Free, client-side OCR for extracting text from receipt images
 */

// @ts-ignore - Tesseract.js types may not be perfect
import { createWorker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  amount?: number;
  date?: string;
  merchant?: string;
  items?: string[];
}

/**
 * Extract text from an image using OCR
 */
export async function extractTextFromImage(imageFile: File | string): Promise<OCRResult> {
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(imageFile);
    await worker.terminate();

    const text = data.text.trim();
    const confidence = data.confidence || 0;

    // Parse extracted data
    const parsed = parseReceiptText(text);

    return {
      text,
      confidence,
      ...parsed,
    };
  } catch (error) {
    await worker.terminate();
    console.error('OCR Error:', error instanceof Error ? error.message : String(error));
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Parse receipt text to extract structured data
 */
function parseReceiptText(text: string): Partial<OCRResult> {
  const result: Partial<OCRResult> = {};

  // Extract amount (look for currency patterns)
  const amountPatterns = [
    /(?:total|amount|rs\.?|inr|₹)\s*:?\s*(\d+(?:\.\d{2})?)/i,
    /(\d+(?:\.\d{2})?)\s*(?:rs\.?|inr|₹)/i,
    /₹\s*(\d+(?:\.\d{2})?)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (amount > 0 && amount < 10000000) { // Reasonable range
        result.amount = amount;
        break;
      }
    }
  }

  // Extract date (look for date patterns)
  const datePatterns = [
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
    /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.date = match[1];
      break;
    }
  }

  // Extract merchant name (usually first line or after "from", "at")
  const merchantPatterns = [
    /(?:from|at|merchant|store)\s*:?\s*([A-Z][A-Za-z\s&]+)/i,
    /^([A-Z][A-Za-z\s&]{3,30})/m,
  ];

  for (const pattern of merchantPatterns) {
    const match = text.match(pattern);
    if (match && match[1].length > 3 && match[1].length < 50) {
      result.merchant = match[1].trim();
      break;
    }
  }

  // Extract items (lines that might be items)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const itemLines = lines
    .filter(line => {
      // Look for lines that might be items (contain numbers, not just headers)
      return /[\d₹]/.test(line) && 
             !/total|amount|date|merchant|store/i.test(line) &&
             line.length > 5 && line.length < 100;
    })
    .slice(0, 10); // Limit to 10 items

  if (itemLines.length > 0) {
    result.items = itemLines;
  }

  return result;
}

/**
 * Extract text with progress callback
 */
export async function extractTextWithProgress(
  imageFile: File | string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(imageFile, {
      // @ts-ignore - logger option exists but may not be in types
      logger: (m: any) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(m.progress);
        }
      },
    } as any);
    await worker.terminate();

    const text = data.text.trim();
    const confidence = data.confidence || 0;
    const parsed = parseReceiptText(text);
    return {
      text,
      confidence,
      ...parsed,
    };
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}

