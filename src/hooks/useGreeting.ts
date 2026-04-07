/**
 * useGreeting — returns a time-of-day-appropriate Hindi greeting.
 *
 *  5 am – 12 pm  → Suprabhaat (Good morning)
 * 12 pm –  5 pm  → Namaste (Good afternoon / general)
 *  5 pm – 10 pm  → Shubh Sandhya (Good evening)
 * 10 pm –  5 am  → Shubh Raatri (Good night)
 */

export type Greeting = {
  hi: string;
  en: string;
  slot: 'morning' | 'afternoon' | 'evening' | 'night';
};

export function useGreeting(date: Date = new Date()): Greeting {
  const h = date.getHours();

  if (h >= 5 && h < 12) {
    return { hi: 'Suprabhaat', en: 'Good morning', slot: 'morning' };
  }
  if (h >= 12 && h < 17) {
    return { hi: 'Namaste', en: 'Good afternoon', slot: 'afternoon' };
  }
  if (h >= 17 && h < 22) {
    return { hi: 'Shubh Sandhya', en: 'Good evening', slot: 'evening' };
  }
  return { hi: 'Shubh Raatri', en: 'Good night', slot: 'night' };
}
