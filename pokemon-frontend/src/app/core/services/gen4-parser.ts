/**
 * Gen 4 save file parser (Diamond, Pearl, Platinum, HeartGold, SoulSilver)
 * File size: exactly 512 KB (0x80000 bytes)
 *
 * References: PKHeX source (SAV4.cs, PokeCrypto.cs), Project Pokémon wiki
 */

import { ParsedSaveData, ParsedPokemon } from '../models/save-parser.types';

// ── Constants ────────────────────────────────────────────────────────────────

const HALF    = 0x40000;  // 256 KB per save half
const PKM_SZ  = 236;      // bytes per party Pokémon slot

/**
 * Block shuffle table (24 permutations of ABCD).
 * BLOCK_POSITION[order * 4 + i] = position in shuffled data where block i lives.
 * Block A=0 (species, item…), B=1 (moves), C=2 (OT info), D=3 (ribbons).
 */
const BLOCK_POSITION = [
  0,1,2,3,  0,1,3,2,  0,2,1,3,  0,3,1,2,  0,2,3,1,  0,3,2,1,
  1,0,2,3,  1,0,3,2,  2,0,1,3,  3,0,1,2,  2,0,3,1,  3,0,2,1,
  1,2,0,3,  1,3,0,2,  2,1,0,3,  3,1,0,2,  2,3,0,1,  3,2,0,1,
  1,2,3,0,  1,3,2,0,  2,1,3,0,  3,1,2,0,  2,3,1,0,  3,2,1,0,
];

/** Per-game config: all offsets relative to the START of the active general block. */
interface GameCfg {
  generalSize: number;   // size of general block (footer = generalBlock + generalSize)
  trainerName: number;   // trainer name offset (8 UCS-2 chars)
  partyCount:  number;   // u32 party count
  partyStart:  number;   // first party slot (6 × PKM_SZ bytes)
  pokedexBase: number;   // base of Pokédex data section
  caughtOfs:   number;   // offset within pokedexBase for national caught flags
  seenOfs:     number;   // offset within pokedexBase for national seen flags
}

const GAME_CFG: Record<string, GameCfg> = {
  // Offsets verified against PKHeX SAV4DP / SAV4Pt / SAV4HGSS
  'diamond':    { generalSize: 0xCF2C, trainerName: 0x64, partyCount: 0xA0, partyStart: 0xA4, pokedexBase: 0x12DC, caughtOfs: 0x04, seenOfs: 0x64 },
  'pearl':      { generalSize: 0xCF2C, trainerName: 0x64, partyCount: 0xA0, partyStart: 0xA4, pokedexBase: 0x12DC, caughtOfs: 0x04, seenOfs: 0x64 },
  'platinum':   { generalSize: 0xCF2C, trainerName: 0x68, partyCount: 0xA0, partyStart: 0xA4, pokedexBase: 0x12D8, caughtOfs: 0x04, seenOfs: 0x64 },
  'heartgold':  { generalSize: 0xF628, trainerName: 0x64, partyCount: 0xA0, partyStart: 0xA4, pokedexBase: 0x12B8, caughtOfs: 0x04, seenOfs: 0x64 },
  'soulsilver': { generalSize: 0xF628, trainerName: 0x64, partyCount: 0xA0, partyStart: 0xA4, pokedexBase: 0x12B8, caughtOfs: 0x04, seenOfs: 0x64 },
};

// Gen 4 character encoding → Unicode (English / International ROMs)
const G4_CHAR: Record<number, string> = (() => {
  const t: Record<number, string> = { 0x0000: ' ', 0xFFFF: '', 0x00D5: 'é', 0x00D6: 'É',
    0x0141: '!', 0x0142: '?', 0x0143: '.', 0x0144: '-', 0x0152: "'", 0x015C: '/', 0x015D: ',',
    0x01AA: '♂', 0x01AB: '♀',
  };
  for (let i = 0; i < 26; i++) { t[0x0100 + i] = String.fromCharCode(65 + i); }   // A–Z
  for (let i = 0; i < 26; i++) { t[0x011A + i] = String.fromCharCode(97 + i); }   // a–z
  for (let i = 0; i < 10; i++) { t[0x0134 + i] = String.fromCharCode(48 + i); }   // 0–9
  return t;
})();

// ── Helpers ──────────────────────────────────────────────────────────────────

/** 32-bit LCRNG advance used for Gen 4 Pokémon encryption. */
function lcrng(state: number): number {
  return Number((BigInt(state >>> 0) * 0x41C64E6Dn + 0x6073n) & 0xFFFFFFFFn);
}

/** Read a Gen 4 encoded trainer name (max 8 chars). */
function readGen4String(view: DataView, offset: number, maxChars = 8): string {
  const parts: string[] = [];
  for (let i = 0; i < maxChars; i++) {
    const code = view.getUint16(offset + i * 2, true);
    if (code === 0xFFFF) break;
    parts.push(G4_CHAR[code] ?? '');
  }
  return parts.join('').trim();
}

/** Decrypt a 236-byte party Pokémon blob. Returns species ID or null if invalid. */
function decryptPartyPokemon(raw: Uint8Array): { species: number; isShiny: boolean } | null {
  if (raw.length < PKM_SZ) return null;

  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const pid      = view.getUint32(0, true);
  const checksum = view.getUint16(6, true);

  // Quick validity: all-zero slots are empty
  if (pid === 0 && checksum === 0) return null;

  // Decrypt the 128-byte data block (bytes 8–135) with LCRNG seeded by checksum
  const decrypted = new Uint8Array(128);
  let seed = checksum;
  for (let i = 0; i < 128; i += 2) {
    seed = lcrng(seed);
    const key = (seed >>> 16) & 0xFFFF;
    decrypted[i]     = (raw[8 + i]     ^ (key & 0xFF)) >>> 0;
    decrypted[i + 1] = (raw[8 + i + 1] ^ (key >>> 8))  >>> 0;
  }

  // Unshuffle 4 × 32-byte sub-blocks (ABCD) based on PID % 24
  const order = pid % 24;
  const unshuffled = new Uint8Array(128);
  for (let blk = 0; blk < 4; blk++) {
    const src = BLOCK_POSITION[order * 4 + blk] * 32;
    unshuffled.set(decrypted.subarray(src, src + 32), blk * 32);
  }

  // Block A (unshuffled[0..31]): first u16 = species
  const dv    = new DataView(unshuffled.buffer);
  const species = dv.getUint16(0, true);

  if (species === 0 || species > 898) return null;  // empty / invalid

  // Shiny check: (TID ^ SID ^ PID_hi ^ PID_lo) < 8
  // TID at block A +0x04, SID at block A +0x06
  const tid  = dv.getUint16(4, true);
  const sid  = dv.getUint16(6, true);
  const isShiny = ((tid ^ sid ^ (pid >>> 16) ^ (pid & 0xFFFF)) >>> 0) < 8;

  return { species, isShiny };
}

/** Read a flag from a byte array at bit position `bitNum` (0-indexed). */
function readFlag(bytes: Uint8Array, byteOffset: number, bitNum: number): boolean {
  const byte = bytes[byteOffset + (bitNum >>> 3)];
  return byte !== undefined && ((byte >> (bitNum & 7)) & 1) === 1;
}

// ── Active block detection ───────────────────────────────────────────────────

/**
 * Returns the byte offset of the active (most recent) general block.
 * Gen 4 stores two halves; the one with the higher u32 save counter is active.
 * The save counter is in the 20-byte block footer at generalBlock + generalSize + 8.
 */
function findActiveBlock(bytes: Uint8Array, cfg: GameCfg): number {
  const view    = new DataView(bytes.buffer, bytes.byteOffset);
  const ctr0    = view.getUint32(cfg.generalSize + 8, true);
  const ctr1    = view.getUint32(HALF + cfg.generalSize + 8, true);
  return ctr1 > ctr0 ? HALF : 0;
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface Gen4ParseResult {
  trainerName:   string;
  seenIds:       number[];
  caughtIds:     number[];
  party:         { species: number; isShiny: boolean; slot: number }[];
}

export function parseGen4(buffer: ArrayBuffer, gameVersion: string): Gen4ParseResult | null {
  const cfg = GAME_CFG[gameVersion];
  if (!cfg) return null;

  const bytes = new Uint8Array(buffer);
  if (bytes.byteLength !== 0x80000) return null;

  const base = findActiveBlock(bytes, cfg);
  const view = new DataView(buffer);

  // ── Trainer name
  const trainerName = readGen4String(view, base + cfg.trainerName) || 'Entrenador';

  // ── Party
  const partyCount = Math.min(view.getUint32(base + cfg.partyCount, true), 6);
  const party: Gen4ParseResult['party'] = [];

  for (let slot = 0; slot < 6; slot++) {
    const ofs = base + cfg.partyStart + slot * PKM_SZ;
    const raw = bytes.slice(ofs, ofs + PKM_SZ);
    const pk  = decryptPartyPokemon(raw);
    if (pk) {
      party.push({ species: pk.species, isShiny: pk.isShiny, slot: slot + 1 });
    }
    if (party.length >= partyCount) break;
  }

  // ── Pokédex flags (national, 1–493)
  const dexBase  = base + cfg.pokedexBase;
  const seenIds: number[] = [];
  const caughtIds: number[] = [];

  for (let dexN = 1; dexN <= 493; dexN++) {
    const bit = dexN - 1;
    if (readFlag(bytes, dexBase + cfg.caughtOfs, bit)) {
      caughtIds.push(dexN);
      seenIds.push(dexN);
    } else if (readFlag(bytes, dexBase + cfg.seenOfs, bit)) {
      seenIds.push(dexN);
    }
  }

  return { trainerName, seenIds, caughtIds, party };
}
