/**
 * Utility functions for patient-related operations
 */

/**
 * Parses drug allergies from various formats into a standardized string array
 * Handles multiple input formats:
 * - JSON array string: '["penicillin", "aspirin"]'
 * - Single string: 'penicillin'
 * - Array: ['penicillin', 'aspirin']
 * - Empty/null values
 * 
 * @param drugAllergies - The drug allergies data in any supported format
 * @returns Array of drug allergy strings, filtered and cleaned
 */
export function parseDrugAllergies(drugAllergies: any): string[] {
  if (!drugAllergies) {
    return [];
  }

  try {
    let allergies: string[] = [];

    if (typeof drugAllergies === 'string') {
      if (drugAllergies.startsWith('[')) {
        // JSON array string เช่น '["penicillin", "aspirin"]'
        allergies = JSON.parse(drugAllergies);
      } else if (drugAllergies.trim() !== '' && drugAllergies !== 'none') {
        // String ธรรมดา เช่น 'penicillin'
        allergies = [drugAllergies];
      }
    } else if (Array.isArray(drugAllergies)) {
      // Array อยู่แล้ว
      allergies = drugAllergies;
    }

    // Filter out empty values and invalid entries
    return allergies.filter(drug => 
      drug && 
      typeof drug === 'string' && 
      drug.trim() !== '' && 
      drug !== 'none' && 
      drug !== 'other'
    );
  } catch (error) {
    console.warn('Error parsing drug_allergies:', error);
    return [];
  }
}

/**
 * Serializes drug allergies array to JSON string for storage
 * 
 * @param drugAllergies - Array of drug allergy strings
 * @returns JSON string representation or empty string if no allergies
 */
export function serializeDrugAllergies(drugAllergies: string[]): string {
  if (!drugAllergies || drugAllergies.length === 0) {
    return '';
  }
  
  return JSON.stringify(drugAllergies);
}
