const GRADIENTS = [
  'linear-gradient(135deg, #061E30, #0D4D7C)',
  'linear-gradient(135deg, #0D4D7C, #1A6A9A)',
  'linear-gradient(135deg, #1A6A9A, #3EC8C8)',
  'linear-gradient(135deg, #0D4D7C, #3EC8C8)',
  'linear-gradient(135deg, #061E30, #1A6A9A)',
  'linear-gradient(135deg, #3EC8C8, #2AACAC)',
  'linear-gradient(135deg, #2AACAC, #0D4D7C)',
];

export function projectGradient(index: number): string {
  return GRADIENTS[index % GRADIENTS.length];
}

export function formatProjectYear(dateStr: string): string {
  return dateStr.slice(0, 4);
}
