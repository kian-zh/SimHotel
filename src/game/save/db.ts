import Dexie, { type Table } from 'dexie'
import type { GameState } from '../types'

export interface SaveSlot {
  id: string
  name: string
  brandName: string
  date: string
  cash: number
  updatedAt: string
  state: GameState
}

class SimHotelDB extends Dexie {
  saves!: Table<SaveSlot, string>

  constructor() {
    super('SimHotelDB')
    this.version(1).stores({
      saves: 'id, updatedAt',
    })
  }
}

export const db = new SimHotelDB()

const AUTO_SAVE_ID = 'autosave'

export async function saveGame(state: GameState, name = '自动存档'): Promise<void> {
  const slot: SaveSlot = {
    id: AUTO_SAVE_ID,
    name,
    brandName: state.brandName,
    date: `${state.date.year}-${state.date.month}-${state.date.day}`,
    cash: state.cash,
    updatedAt: new Date().toISOString(),
    state,
  }
  await db.saves.put(slot)
}

export async function loadGame(id = AUTO_SAVE_ID): Promise<GameState | null> {
  const slot = await db.saves.get(id)
  return slot?.state ?? null
}

export async function listSaves(): Promise<SaveSlot[]> {
  return db.saves.orderBy('updatedAt').reverse().toArray()
}

export async function deleteSave(id = AUTO_SAVE_ID): Promise<void> {
  await db.saves.delete(id)
}

export async function hasSave(id = AUTO_SAVE_ID): Promise<boolean> {
  const slot = await db.saves.get(id)
  return slot != null
}
