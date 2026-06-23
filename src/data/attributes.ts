import type { Attribute, AttributeId } from './types'

// The five core attributes - RPG-style stat groups the traits roll up into.
export const ATTRIBUTES: Attribute[] = [
  {
    id: 'mind',
    name: 'Mind',
    short: 'INT',
    path: 'Path to Enlightenment',
    blurb: 'Clarity, focus, and the machinery of thought.',
    color: '#22d3ee',
    icon: '🧠',
  },
  {
    id: 'will',
    name: 'Will',
    short: 'DIS',
    path: 'Path of Iron',
    blurb: 'Discipline, consistency and follow-through.',
    color: '#7cfc00',
    icon: '⚔️',
  },
  {
    id: 'heart',
    name: 'Heart',
    short: 'EMO',
    path: 'Path of the Lionheart',
    blurb: 'Emotional strength, resilience and self-worth.',
    color: '#ec4899',
    icon: '❤️',
  },
  {
    id: 'charisma',
    name: 'Charisma',
    short: 'CHA',
    path: 'Path of Influence',
    blurb: 'Presence, communication and influence.',
    color: '#a855f7',
    icon: '✨',
  },
  {
    id: 'body',
    name: 'Body',
    short: 'VIT',
    path: 'Path of the Titan',
    blurb: 'Energy, health and the physical vessel.',
    color: '#fbbf24',
    icon: '🜂',
  },
]

export const attributeById = (id: AttributeId): Attribute =>
  ATTRIBUTES.find((a) => a.id === id)!
