/**
 * Date formatting utilities
 */

/**
 * Format a date as a Thai date string
 * @param date Date to format
 * @returns Formatted date string in Thai format
 */
export function formatThaiDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Thai months
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const day = dateObj.getDate();
  const month = thaiMonths[dateObj.getMonth()];
  // Convert to Buddhist Era (BE) by adding 543 years
  const year = dateObj.getFullYear() + 543;
  
  return `${day} ${month} ${year}`;
}

/**
 * Format a date as a short date string
 * @param date Date to format
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatShortDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Format a date with time
 * @param date Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
} 