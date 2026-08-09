export function getFrenchGreeting(parisHour: number): string {
  if (parisHour >= 5 && parisHour < 18) return 'Bonjour'
  if (parisHour >= 18 && parisHour < 23) return 'Bonsoir'
  return 'Bonne nuit'
}

