import { useEffect, useState } from 'react'
import {
  FIRST_NAME_UPDATED_EVENT,
  getFirstName,
} from '../services/userProfileService'

const morningGreetings = [
  'Rise and shine{, name}! ☀️',
  'Morning{name}! Coffee first. ☕',
  'Good morning{name}! Let\'s go. 🚀',
  'Fresh start{name}! 🌤️',
]

const daytimeGreetings = [
  'Hey{name}! 👋',
  'Look who it is{name}! 😎',
  'What\'s up{name}? ✌️',
  'Good to see you{name}! ✨',
]

const nightGreetings = [
  'Up late{name}? 🌙',
  'Night owl mode! 🦉',
  'Still going{name}? 🌃',
  'Late-night momentum{name}! 🌌',
]

export type GreetingPeriod = 'morning' | 'daytime' | 'night'

function getGreetingPeriod(hour: number): GreetingPeriod {
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 22) return 'daytime'
  return 'night'
}

function pickGreeting(firstName: string) {
  const hour = new Date().getHours()
  const period = getGreetingPeriod(hour)
  const options = period === 'morning' ? morningGreetings : period === 'daytime' ? daytimeGreetings : nightGreetings
  const phrase = options[Math.floor(Math.random() * options.length)]
  const name = firstName.trim()
  return {
    phrase: phrase.replace('{, name}', name ? `, ${name}` : '').replace('{name}', name ? ` ${name}` : ''),
    period,
  }
}

export function useGreeting(firstName?: string | null) {
  const [greeting, setGreeting] = useState<{ phrase: string; period: GreetingPeriod } | null>(null)

  useEffect(() => {
    const update = () => setGreeting(pickGreeting(firstName ?? getFirstName()))
    update()
    window.addEventListener(FIRST_NAME_UPDATED_EVENT, update)
    return () => window.removeEventListener(FIRST_NAME_UPDATED_EVENT, update)
  }, [firstName])

  return greeting ?? { phrase: '', period: 'daytime' as GreetingPeriod }
}