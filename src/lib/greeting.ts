export function getFrenchGreeting(displayHour: number): string {
  if (displayHour >= 5 && displayHour < 17) return 'Bonjour'
  if (displayHour >= 17 && displayHour < 23) return 'Bonsoir'
  return 'Bonne Nuit'
}
