import { atom } from 'jotai'

const fontAtom = atom('')

const bgAtom = atom('')

const selectedGameIdsAtom = atom<string[]>([])

const gameSearchAtom = atom('')

const showNsfwAtom = atom(true)

export { fontAtom, bgAtom, selectedGameIdsAtom, gameSearchAtom, showNsfwAtom }
