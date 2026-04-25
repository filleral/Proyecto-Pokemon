import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TeamsService } from '../../core/services/teams.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { AuthService } from '../../core/services/auth.service';
import { PokemonTeam, TeamMember } from '../../core/models/pokemon.model';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError, forkJoin } from 'rxjs';
import { Subject } from 'rxjs';

// ── Natures ──────────────────────────────────────────────────────────────────
const NATURES: { name: string; es: string; plus: string | null; minus: string | null }[] = [
  { name: 'hardy',    es: 'Hardy',     plus: null,              minus: null },
  { name: 'lonely',   es: 'Huraño',    plus: 'attack',          minus: 'defense' },
  { name: 'brave',    es: 'Audaz',     plus: 'attack',          minus: 'speed' },
  { name: 'adamant',  es: 'Firme',     plus: 'attack',          minus: 'special-attack' },
  { name: 'naughty',  es: 'Pícaro',    plus: 'attack',          minus: 'special-defense' },
  { name: 'bold',     es: 'Osado',     plus: 'defense',         minus: 'attack' },
  { name: 'docile',   es: 'Dócil',     plus: null,              minus: null },
  { name: 'relaxed',  es: 'Plácido',   plus: 'defense',         minus: 'speed' },
  { name: 'impish',   es: 'Impasible', plus: 'defense',         minus: 'special-attack' },
  { name: 'lax',      es: 'Flojo',     plus: 'defense',         minus: 'special-defense' },
  { name: 'timid',    es: 'Miedoso',   plus: 'speed',           minus: 'attack' },
  { name: 'hasty',    es: 'Activo',    plus: 'speed',           minus: 'defense' },
  { name: 'serious',  es: 'Serio',     plus: null,              minus: null },
  { name: 'jolly',    es: 'Alegre',    plus: 'speed',           minus: 'special-attack' },
  { name: 'naive',    es: 'Ingenuo',   plus: 'speed',           minus: 'special-defense' },
  { name: 'modest',   es: 'Modesto',   plus: 'special-attack',  minus: 'attack' },
  { name: 'mild',     es: 'Afable',    plus: 'special-attack',  minus: 'defense' },
  { name: 'quiet',    es: 'Quieto',    plus: 'special-attack',  minus: 'speed' },
  { name: 'bashful',  es: 'Tímido',    plus: null,              minus: null },
  { name: 'rash',     es: 'Alocado',   plus: 'special-attack',  minus: 'special-defense' },
  { name: 'calm',     es: 'Sereno',    plus: 'special-defense', minus: 'attack' },
  { name: 'gentle',   es: 'Amable',    plus: 'special-defense', minus: 'defense' },
  { name: 'sassy',    es: 'Grosero',   plus: 'special-defense', minus: 'speed' },
  { name: 'careful',  es: 'Cauto',     plus: 'special-defense', minus: 'special-attack' },
  { name: 'quirky',   es: 'Raro',      plus: null,              minus: null },
];

const STAT_KEYS   = ['evHp','evAtk','evDef','evSpAtk','evSpDef','evSpeed'] as const;
const STAT_LABELS: Record<string,string> = {
  evHp:'HP', evAtk:'Ataque', evDef:'Defensa', evSpAtk:'Atq. Esp.', evSpDef:'Def. Esp.', evSpeed:'Velocidad',
  ivHp:'HP', ivAtk:'Ataque', ivDef:'Defensa', ivSpAtk:'Atq. Esp.', ivSpDef:'Def. Esp.', ivSpeed:'Velocidad',
};
const IV_KEYS = ['ivHp','ivAtk','ivDef','ivSpAtk','ivSpDef','ivSpeed'] as const;

// ── Items ────────────────────────────────────────────────────────────────────
interface ItemEntry { name: string; display: string; category: string; forTypes?: string[]; }

const ITEMS: ItemEntry[] = [
  { name: 'choice-band',       display: 'Banda Elegida',          category: 'choice' },
  { name: 'choice-scarf',      display: 'Pañuelo Elegido',        category: 'choice' },
  { name: 'choice-specs',      display: 'Gafas Elegidas',         category: 'choice' },
  { name: 'leftovers',         display: 'Restos',                 category: 'recovery' },
  { name: 'black-sludge',      display: 'Lodo Negro',             category: 'recovery', forTypes: ['poison'] },
  { name: 'shell-bell',        display: 'Cascabel',               category: 'recovery' },
  { name: 'sitrus-berry',      display: 'Baya Ziuela',            category: 'berry' },
  { name: 'lum-berry',         display: 'Baya Zirnitra',          category: 'berry' },
  { name: 'figy-berry',        display: 'Baya Figy',              category: 'berry' },
  { name: 'life-orb',          display: 'Orbe Vida',              category: 'offensive' },
  { name: 'expert-belt',       display: 'Cinto Experto',          category: 'offensive' },
  { name: 'muscle-band',       display: 'Banda Muscular',         category: 'offensive' },
  { name: 'wise-glasses',      display: 'Gafas Sabias',           category: 'offensive' },
  { name: 'metronome',         display: 'Metrónomo',              category: 'offensive' },
  { name: 'weakness-policy',   display: 'Política Debilidad',     category: 'offensive' },
  { name: 'throat-spray',      display: 'Pulverizador',           category: 'offensive' },
  { name: 'loaded-dice',       display: 'Dado Trucado',           category: 'offensive' },
  { name: 'booster-energy',    display: 'Energía Turbo',          category: 'offensive' },
  { name: 'rocky-helmet',      display: 'Casco Férreo',           category: 'defensive' },
  { name: 'assault-vest',      display: 'Chaleco Asalto',         category: 'defensive' },
  { name: 'eviolite',          display: 'Eviolita',               category: 'defensive' },
  { name: 'focus-sash',        display: 'Faja Aguante',           category: 'defensive' },
  { name: 'air-balloon',       display: 'Globo Aire',             category: 'defensive' },
  { name: 'heavy-duty-boots',  display: 'Botas Resistentes',      category: 'defensive' },
  { name: 'covert-cloak',      display: 'Capa Encubierta',        category: 'defensive' },
  { name: 'safety-goggles',    display: 'Gafas Protectoras',      category: 'defensive' },
  { name: 'utility-umbrella',  display: 'Paraguas Resistente',    category: 'defensive' },
  { name: 'clear-amulet',      display: 'Amuleto Límpido',        category: 'defensive' },
  { name: 'iron-ball',         display: 'Bola Férrea',            category: 'speed' },
  { name: 'lagging-tail',      display: 'Cola Rémora',            category: 'speed' },
  { name: 'room-service',      display: 'Servicio Habitación',    category: 'speed' },
  { name: 'shed-shell',        display: 'Muda Extra',             category: 'utility' },
  { name: 'scope-lens',        display: 'Lupa',                   category: 'utility' },
  { name: 'razor-claw',        display: 'Garra Filo',             category: 'utility' },
  { name: 'wide-lens',         display: 'Lente Amplia',           category: 'utility' },
  { name: 'kings-rock',        display: 'Roca Rey',               category: 'utility' },
  { name: 'eject-pack',        display: 'Kit Eyectable',          category: 'utility' },
  { name: 'mirror-herb',       display: 'Hierba Espejo',          category: 'utility' },
  { name: 'binding-band',      display: 'Banda Presa',            category: 'utility' },
  { name: 'protective-pads',   display: 'Almohadillas',           category: 'utility' },
  { name: 'electric-seed',     display: 'Semilla Eléctrica',      category: 'utility' },
  { name: 'psychic-seed',      display: 'Semilla Psíquica',       category: 'utility' },
  { name: 'misty-seed',        display: 'Semilla Vaporosa',       category: 'utility' },
  { name: 'grassy-seed',       display: 'Semilla Herbosa',        category: 'utility' },
  { name: 'salac-berry',       display: 'Baya Salác',             category: 'berry' },
  { name: 'petaya-berry',      display: 'Baya Petaya',            category: 'berry' },
  { name: 'liechi-berry',      display: 'Baya Liechi',            category: 'berry' },
  { name: 'apicot-berry',      display: 'Baya Aloque',            category: 'berry' },
  { name: 'lansat-berry',      display: 'Baya Lamina',            category: 'berry' },
  { name: 'starf-berry',       display: 'Baya Adrena',            category: 'berry' },
  { name: 'silk-scarf',        display: 'Pañuelo Seda',           category: 'type-boost', forTypes: ['normal'] },
  { name: 'charcoal',          display: 'Carbón',                 category: 'type-boost', forTypes: ['fire'] },
  { name: 'mystic-water',      display: 'Agua Mística',           category: 'type-boost', forTypes: ['water'] },
  { name: 'miracle-seed',      display: 'Semilla Milagro',        category: 'type-boost', forTypes: ['grass'] },
  { name: 'magnet',            display: 'Imán',                   category: 'type-boost', forTypes: ['electric'] },
  { name: 'never-melt-ice',    display: 'Hielo Eterno',           category: 'type-boost', forTypes: ['ice'] },
  { name: 'black-belt',        display: 'Cinturón Negro',         category: 'type-boost', forTypes: ['fighting'] },
  { name: 'poison-barb',       display: 'Espina Veneno',          category: 'type-boost', forTypes: ['poison'] },
  { name: 'soft-sand',         display: 'Arena Fina',             category: 'type-boost', forTypes: ['ground'] },
  { name: 'sharp-beak',        display: 'Pico Agudo',             category: 'type-boost', forTypes: ['flying'] },
  { name: 'twisted-spoon',     display: 'Cuchara Torcida',        category: 'type-boost', forTypes: ['psychic'] },
  { name: 'silver-powder',     display: 'Polvo Plata',            category: 'type-boost', forTypes: ['bug'] },
  { name: 'hard-stone',        display: 'Roca Dura',              category: 'type-boost', forTypes: ['rock'] },
  { name: 'spell-tag',         display: 'Etiqueta Espectral',     category: 'type-boost', forTypes: ['ghost'] },
  { name: 'dragon-fang',       display: 'Colmillo Dragón',        category: 'type-boost', forTypes: ['dragon'] },
  { name: 'black-glasses',     display: 'Lentes Oscuros',         category: 'type-boost', forTypes: ['dark'] },
  { name: 'metal-coat',        display: 'Revestimiento Metálico', category: 'type-boost', forTypes: ['steel'] },
  { name: 'fairy-feather',     display: 'Pluma Hada',             category: 'type-boost', forTypes: ['fairy'] },
  { name: 'odd-incense',       display: 'Incienso Raro',          category: 'type-boost', forTypes: ['psychic'] },
  { name: 'sea-incense',       display: 'Incienso Mar',           category: 'type-boost', forTypes: ['water'] },
  { name: 'thick-club',        display: 'Mazo Grande',            category: 'offensive' },
  { name: 'light-ball',        display: 'Bola Luz',               category: 'offensive' },
  { name: 'deep-sea-tooth',    display: 'Diente Mar Prof.',       category: 'offensive' },
  { name: 'deep-sea-scale',    display: 'Escama Mar Prof.',       category: 'defensive' },
];

const CAT_LABELS: Record<string,string> = {
  choice:'Elegido', recovery:'Recuperación', offensive:'Ofensivo',
  defensive:'Defensivo', berry:'Baya', 'type-boost':'Tipo', utility:'Utilidad', speed:'Velocidad',
};
const CAT_COLORS: Record<string,string> = {
  choice:'#7c4dff', recovery:'#00897b', offensive:'#e53935',
  defensive:'#1976d2', berry:'#43a047', 'type-boost':'#f57c00', utility:'#546e7a', speed:'#8e24aa',
};

function getRecommendedItems(types: string[], stats: Array<{base_stat:number;stat:{name:string}}>): string[] {
  const g = (n:string) => stats.find(s=>s.stat.name===n)?.base_stat??0;
  const atk=g('attack'), spAtk=g('special-attack'), def=g('defense'), spDef=g('special-defense'), hp=g('hp'), speed=g('speed');
  const isPhysical=atk>=spAtk+20, isSpecial=spAtk>=atk+20, isBulky=(hp+def+spDef)/3>=85, isFast=speed>=100, isPoison=types.includes('poison');
  const picks: string[] = [];
  types.forEach(t => { const m=ITEMS.find(i=>i.forTypes?.includes(t)&&i.category==='type-boost'); if(m) picks.push(m.name); });
  if(isPhysical) { picks.push('choice-band','life-orb','expert-belt','muscle-band'); if(!isFast) picks.push('choice-scarf'); }
  else if(isSpecial) { picks.push('choice-specs','life-orb','expert-belt','wise-glasses'); if(!isFast) picks.push('choice-scarf'); }
  else picks.push('life-orb','choice-band','choice-specs','expert-belt');
  if(isBulky) { picks.push('leftovers','rocky-helmet','assault-vest','heavy-duty-boots'); if(isPoison) picks.push('black-sludge'); }
  else picks.push('focus-sash','heavy-duty-boots');
  if(!isFast) picks.push('choice-scarf');
  picks.push('lum-berry');
  return [...new Set(picks)].slice(0,10);
}

// ── Moves ────────────────────────────────────────────────────────────────────
interface MoveEntry { name: string; type: string; category: 'physical'|'special'|'status'; power: number; flags?: string[]; }

const MOVE_DATA: MoveEntry[] = [
  // Normal
  { name:'extreme-speed',    type:'normal',   category:'physical', power:80,  flags:['priority'] },
  { name:'facade',           type:'normal',   category:'physical', power:70,  flags:['secondary'] },
  { name:'return',           type:'normal',   category:'physical', power:102, flags:[] },
  { name:'body-slam',        type:'normal',   category:'physical', power:85,  flags:['secondary'] },
  { name:'double-edge',      type:'normal',   category:'physical', power:120, flags:['recoil'] },
  { name:'explosion',        type:'normal',   category:'physical', power:120, flags:[] },
  { name:'quick-attack',     type:'normal',   category:'physical', power:40,  flags:['priority'] },
  { name:'rapid-spin',       type:'normal',   category:'physical', power:50,  flags:['hazard-remove'] },
  { name:'hyper-voice',      type:'normal',   category:'special',  power:90,  flags:['sound'] },
  { name:'boomburst',        type:'normal',   category:'special',  power:140, flags:['sound'] },
  { name:'swift',            type:'normal',   category:'special',  power:60,  flags:[] },
  { name:'swords-dance',     type:'normal',   category:'status',   power:0,   flags:['setup'] },
  { name:'nasty-plot',       type:'dark',     category:'status',   power:0,   flags:['setup'] },
  { name:'calm-mind',        type:'psychic',  category:'status',   power:0,   flags:['setup'] },
  { name:'bulk-up',          type:'fighting', category:'status',   power:0,   flags:['setup'] },
  { name:'quiver-dance',     type:'bug',      category:'status',   power:0,   flags:['setup'] },
  { name:'dragon-dance',     type:'dragon',   category:'status',   power:0,   flags:['setup'] },
  { name:'shift-gear',       type:'steel',    category:'status',   power:0,   flags:['setup'] },
  { name:'agility',          type:'psychic',  category:'status',   power:0,   flags:['setup'] },
  { name:'belly-drum',       type:'normal',   category:'status',   power:0,   flags:['setup'] },
  { name:'stealth-rock',     type:'rock',     category:'status',   power:0,   flags:['hazard'] },
  { name:'spikes',           type:'ground',   category:'status',   power:0,   flags:['hazard'] },
  { name:'toxic-spikes',     type:'poison',   category:'status',   power:0,   flags:['hazard'] },
  { name:'sticky-web',       type:'bug',      category:'status',   power:0,   flags:['hazard'] },
  { name:'defog',            type:'flying',   category:'status',   power:0,   flags:['hazard-remove'] },
  { name:'will-o-wisp',      type:'fire',     category:'status',   power:0,   flags:['status-effect'] },
  { name:'thunder-wave',     type:'electric', category:'status',   power:0,   flags:['status-effect'] },
  { name:'toxic',            type:'poison',   category:'status',   power:0,   flags:['status-effect'] },
  { name:'sleep-powder',     type:'grass',    category:'status',   power:0,   flags:['status-effect'] },
  { name:'spore',            type:'grass',    category:'status',   power:0,   flags:['status-effect'] },
  { name:'leech-seed',       type:'grass',    category:'status',   power:0,   flags:['recovery'] },
  { name:'protect',          type:'normal',   category:'status',   power:0,   flags:[] },
  { name:'substitute',       type:'normal',   category:'status',   power:0,   flags:[] },
  { name:'recover',          type:'normal',   category:'status',   power:0,   flags:['recovery'] },
  { name:'roost',            type:'flying',   category:'status',   power:0,   flags:['recovery'] },
  { name:'rest',             type:'psychic',  category:'status',   power:0,   flags:['recovery'] },
  { name:'slack-off',        type:'normal',   category:'status',   power:0,   flags:['recovery'] },
  { name:'shore-up',         type:'ground',   category:'status',   power:0,   flags:['recovery'] },
  { name:'wish',             type:'normal',   category:'status',   power:0,   flags:['recovery'] },
  { name:'teleport',         type:'psychic',  category:'status',   power:0,   flags:['pivot'] },
  { name:'parting-shot',     type:'dark',     category:'status',   power:0,   flags:['pivot'] },
  { name:'taunt',            type:'dark',     category:'status',   power:0,   flags:[] },
  { name:'trick',            type:'psychic',  category:'status',   power:0,   flags:[] },
  { name:'trick-room',       type:'psychic',  category:'status',   power:0,   flags:[] },
  { name:'tailwind',         type:'flying',   category:'status',   power:0,   flags:[] },
  { name:'haze',             type:'ice',      category:'status',   power:0,   flags:[] },
  { name:'reflect',          type:'psychic',  category:'status',   power:0,   flags:[] },
  { name:'light-screen',     type:'psychic',  category:'status',   power:0,   flags:[] },
  { name:'aurora-veil',      type:'ice',      category:'status',   power:0,   flags:[] },
  { name:'baton-pass',       type:'normal',   category:'status',   power:0,   flags:['pivot'] },
  // Fire
  { name:'flare-blitz',      type:'fire',     category:'physical', power:120, flags:['recoil','secondary'] },
  { name:'fire-punch',       type:'fire',     category:'physical', power:75,  flags:['secondary'] },
  { name:'fire-fang',        type:'fire',     category:'physical', power:65,  flags:['secondary'] },
  { name:'pyro-ball',        type:'fire',     category:'physical', power:120, flags:['secondary'] },
  { name:'flamethrower',     type:'fire',     category:'special',  power:90,  flags:['secondary'] },
  { name:'fire-blast',       type:'fire',     category:'special',  power:110, flags:['secondary'] },
  { name:'heat-wave',        type:'fire',     category:'special',  power:95,  flags:['secondary'] },
  { name:'overheat',         type:'fire',     category:'special',  power:130, flags:[] },
  { name:'mystical-fire',    type:'fire',     category:'special',  power:75,  flags:['secondary'] },
  { name:'burning-jealousy', type:'fire',     category:'special',  power:70,  flags:['secondary'] },
  // Water
  { name:'waterfall',        type:'water',    category:'physical', power:80,  flags:['secondary'] },
  { name:'liquidation',      type:'water',    category:'physical', power:85,  flags:['secondary'] },
  { name:'wave-crash',       type:'water',    category:'physical', power:120, flags:['recoil'] },
  { name:'aqua-jet',         type:'water',    category:'physical', power:40,  flags:['priority'] },
  { name:'flip-turn',        type:'water',    category:'physical', power:60,  flags:['pivot'] },
  { name:'surf',             type:'water',    category:'special',  power:90,  flags:[] },
  { name:'hydro-pump',       type:'water',    category:'special',  power:110, flags:[] },
  { name:'scald',            type:'water',    category:'special',  power:80,  flags:['secondary'] },
  { name:'water-spout',      type:'water',    category:'special',  power:110, flags:[] },
  // Grass
  { name:'wood-hammer',      type:'grass',    category:'physical', power:120, flags:['recoil'] },
  { name:'power-whip',       type:'grass',    category:'physical', power:120, flags:[] },
  { name:'seed-bomb',        type:'grass',    category:'physical', power:80,  flags:[] },
  { name:'petal-blizzard',   type:'grass',    category:'physical', power:90,  flags:[] },
  { name:'giga-drain',       type:'grass',    category:'special',  power:75,  flags:['drain'] },
  { name:'energy-ball',      type:'grass',    category:'special',  power:90,  flags:['secondary'] },
  { name:'solar-beam',       type:'grass',    category:'special',  power:120, flags:[] },
  { name:'leaf-storm',       type:'grass',    category:'special',  power:130, flags:[] },
  { name:'seed-flare',       type:'grass',    category:'special',  power:120, flags:['secondary'] },
  // Electric
  { name:'wild-charge',      type:'electric', category:'physical', power:90,  flags:['recoil'] },
  { name:'thunder-punch',    type:'electric', category:'physical', power:75,  flags:['secondary'] },
  { name:'spark',            type:'electric', category:'physical', power:65,  flags:['secondary'] },
  { name:'thunderbolt',      type:'electric', category:'special',  power:90,  flags:['secondary'] },
  { name:'thunder',          type:'electric', category:'special',  power:110, flags:['secondary'] },
  { name:'discharge',        type:'electric', category:'special',  power:80,  flags:['secondary'] },
  { name:'volt-switch',      type:'electric', category:'special',  power:70,  flags:['pivot'] },
  { name:'rising-voltage',   type:'electric', category:'special',  power:70,  flags:[] },
  // Ice
  { name:'ice-punch',        type:'ice',      category:'physical', power:75,  flags:['secondary'] },
  { name:'ice-shard',        type:'ice',      category:'physical', power:40,  flags:['priority'] },
  { name:'icicle-crash',     type:'ice',      category:'physical', power:85,  flags:['secondary'] },
  { name:'icicle-spear',     type:'ice',      category:'physical', power:25,  flags:['multi-hit'] },
  { name:'ice-beam',         type:'ice',      category:'special',  power:90,  flags:['secondary'] },
  { name:'blizzard',         type:'ice',      category:'special',  power:110, flags:['secondary'] },
  { name:'freeze-dry',       type:'ice',      category:'special',  power:70,  flags:['secondary'] },
  // Fighting
  { name:'close-combat',     type:'fighting', category:'physical', power:120, flags:[] },
  { name:'drain-punch',      type:'fighting', category:'physical', power:75,  flags:['drain'] },
  { name:'mach-punch',       type:'fighting', category:'physical', power:40,  flags:['priority'] },
  { name:'brick-break',      type:'fighting', category:'physical', power:75,  flags:[] },
  { name:'superpower',       type:'fighting', category:'physical', power:120, flags:[] },
  { name:'high-jump-kick',   type:'fighting', category:'physical', power:130, flags:['recoil'] },
  { name:'low-kick',         type:'fighting', category:'physical', power:80,  flags:[] },
  { name:'aura-sphere',      type:'fighting', category:'special',  power:80,  flags:[] },
  { name:'focus-blast',      type:'fighting', category:'special',  power:120, flags:['secondary'] },
  // Poison
  { name:'poison-jab',       type:'poison',   category:'physical', power:80,  flags:['secondary'] },
  { name:'gunk-shot',        type:'poison',   category:'physical', power:120, flags:['secondary'] },
  { name:'sludge-bomb',      type:'poison',   category:'special',  power:90,  flags:['secondary'] },
  { name:'sludge-wave',      type:'poison',   category:'special',  power:95,  flags:['secondary'] },
  { name:'venoshock',        type:'poison',   category:'special',  power:65,  flags:[] },
  // Ground
  { name:'earthquake',       type:'ground',   category:'physical', power:100, flags:[] },
  { name:'high-horsepower',  type:'ground',   category:'physical', power:95,  flags:[] },
  { name:'precipice-blades', type:'ground',   category:'physical', power:120, flags:[] },
  { name:'drill-run',        type:'ground',   category:'physical', power:80,  flags:[] },
  { name:'earth-power',      type:'ground',   category:'special',  power:90,  flags:['secondary'] },
  // Flying
  { name:'brave-bird',       type:'flying',   category:'physical', power:120, flags:['recoil'] },
  { name:'drill-peck',       type:'flying',   category:'physical', power:80,  flags:[] },
  { name:'acrobatics',       type:'flying',   category:'physical', power:55,  flags:[] },
  { name:'dual-wingbeat',    type:'flying',   category:'physical', power:40,  flags:['multi-hit'] },
  { name:'air-slash',        type:'flying',   category:'special',  power:75,  flags:['secondary'] },
  { name:'hurricane',        type:'flying',   category:'special',  power:110, flags:['secondary'] },
  // Psychic
  { name:'psycho-cut',       type:'psychic',  category:'physical', power:70,  flags:[] },
  { name:'zen-headbutt',     type:'psychic',  category:'physical', power:80,  flags:['secondary'] },
  { name:'psychic',          type:'psychic',  category:'special',  power:90,  flags:['secondary'] },
  { name:'psyshock',         type:'psychic',  category:'special',  power:80,  flags:[] },
  { name:'expanding-force',  type:'psychic',  category:'special',  power:80,  flags:[] },
  { name:'stored-power',     type:'psychic',  category:'special',  power:80,  flags:[] },
  // Bug
  { name:'u-turn',           type:'bug',      category:'physical', power:70,  flags:['pivot'] },
  { name:'x-scissor',        type:'bug',      category:'physical', power:80,  flags:[] },
  { name:'megahorn',         type:'bug',      category:'physical', power:120, flags:[] },
  { name:'leech-life',       type:'bug',      category:'physical', power:80,  flags:['drain'] },
  { name:'lunge',            type:'bug',      category:'physical', power:80,  flags:['secondary'] },
  { name:'bug-buzz',         type:'bug',      category:'special',  power:90,  flags:['sound','secondary'] },
  { name:'pollen-puff',      type:'bug',      category:'special',  power:90,  flags:[] },
  // Rock
  { name:'stone-edge',       type:'rock',     category:'physical', power:100, flags:[] },
  { name:'rock-slide',       type:'rock',     category:'physical', power:75,  flags:['secondary'] },
  { name:'head-smash',       type:'rock',     category:'physical', power:150, flags:['recoil'] },
  { name:'rock-blast',       type:'rock',     category:'physical', power:25,  flags:['multi-hit'] },
  { name:'diamond-storm',    type:'rock',     category:'physical', power:100, flags:['secondary'] },
  { name:'power-gem',        type:'rock',     category:'special',  power:80,  flags:[] },
  // Ghost
  { name:'shadow-claw',      type:'ghost',    category:'physical', power:70,  flags:[] },
  { name:'shadow-sneak',     type:'ghost',    category:'physical', power:40,  flags:['priority'] },
  { name:'phantom-force',    type:'ghost',    category:'physical', power:90,  flags:[] },
  { name:'poltergeist',      type:'ghost',    category:'physical', power:110, flags:[] },
  { name:'shadow-ball',      type:'ghost',    category:'special',  power:80,  flags:['secondary'] },
  { name:'hex',              type:'ghost',    category:'special',  power:65,  flags:[] },
  // Dragon
  { name:'dragon-claw',      type:'dragon',   category:'physical', power:80,  flags:[] },
  { name:'outrage',          type:'dragon',   category:'physical', power:120, flags:[] },
  { name:'scale-shot',       type:'dragon',   category:'physical', power:25,  flags:['multi-hit','secondary'] },
  { name:'breaking-swipe',   type:'dragon',   category:'physical', power:60,  flags:['secondary'] },
  { name:'dragon-pulse',     type:'dragon',   category:'special',  power:85,  flags:[] },
  { name:'draco-meteor',     type:'dragon',   category:'special',  power:130, flags:[] },
  { name:'spacial-rend',     type:'dragon',   category:'special',  power:100, flags:[] },
  // Dark
  { name:'knock-off',        type:'dark',     category:'physical', power:65,  flags:[] },
  { name:'sucker-punch',     type:'dark',     category:'physical', power:70,  flags:['priority'] },
  { name:'crunch',           type:'dark',     category:'physical', power:80,  flags:['secondary'] },
  { name:'throat-slash',     type:'dark',     category:'physical', power:70,  flags:['secondary'] },
  { name:'wicked-blow',      type:'dark',     category:'physical', power:75,  flags:[] },
  { name:'dark-pulse',       type:'dark',     category:'special',  power:80,  flags:['secondary'] },
  // Steel
  { name:'iron-head',        type:'steel',    category:'physical', power:80,  flags:['secondary'] },
  { name:'meteor-mash',      type:'steel',    category:'physical', power:90,  flags:['secondary'] },
  { name:'smart-strike',     type:'steel',    category:'physical', power:70,  flags:[] },
  { name:'bullet-punch',     type:'steel',    category:'physical', power:40,  flags:['priority'] },
  { name:'gyro-ball',        type:'steel',    category:'physical', power:60,  flags:[] },
  { name:'flash-cannon',     type:'steel',    category:'special',  power:80,  flags:['secondary'] },
  { name:'steel-beam',       type:'steel',    category:'special',  power:140, flags:['recoil'] },
  // Fairy
  { name:'play-rough',       type:'fairy',    category:'physical', power:90,  flags:['secondary'] },
  { name:'moonblast',        type:'fairy',    category:'special',  power:95,  flags:['secondary'] },
  { name:'dazzling-gleam',   type:'fairy',    category:'special',  power:80,  flags:[] },
  { name:'misty-explosion',  type:'fairy',    category:'special',  power:100, flags:[] },
];

function getRecommendedMoves(
  types: string[],
  stats: Array<{base_stat:number;stat:{name:string}}>,
  ability: string,
  heldItem: string,
  evs: {evAtk:number;evSpAtk:number;evHp:number;evDef:number;evSpDef:number;evSpeed:number},
  learnableMoves: string[]
): string[] {
  const g = (n:string) => stats.find(s=>s.stat.name===n)?.base_stat??0;
  const bAtk=g('attack'), bSpAtk=g('special-attack'), bDef=g('defense'), bSpDef=g('special-defense'), bHp=g('hp');
  const isPhysical=bAtk>=bSpAtk+15, isSpecial=bSpAtk>=bAtk+15, isBulky=(bHp+bDef+bSpDef)/3>=80;
  const item=heldItem.toLowerCase(), ab=ability.toLowerCase();

  const itemFavPhys = item.includes('banda elegida')||item.includes('banda muscular');
  const itemFavSpec = item.includes('gafas elegidas')||item.includes('gafas sabias');
  const isChoice    = itemFavPhys||itemFavSpec||item.includes('pañuelo elegido');
  const hasSoundItem= item.includes('pulverizador');
  const hasLoadedD  = item.includes('dado trucado');
  const hasAV       = item.includes('chaleco asalto');

  const evFavPhys = evs.evAtk >= evs.evSpAtk+100;
  const evFavSpec = evs.evSpAtk >= evs.evAtk+100;
  const prefPhys  = isPhysical||itemFavPhys||evFavPhys;
  const prefSpec  = isSpecial||itemFavSpec||evFavSpec;

  const weatherBoost: Record<string,string> = { drought:'fire',drizzle:'water','sand-stream':'rock','snow-warning':'ice' };
  const boostedType = weatherBoost[ab]??null;
  const hasPixilate = ['pixilate','refrigerate','aerilate','galvanize'].includes(ab);
  const hasGuts     = ab==='guts';
  const hasTech     = ab==='technician';
  const hasSF       = ab==='sheer-force'||ab==='serene-grace';

  const learnSet = new Set(learnableMoves);
  const scored: {name:string;score:number}[] = [];

  for (const mv of MOVE_DATA) {
    if (!learnSet.has(mv.name)) continue;
    let sc = 0;
    if (mv.power>0) sc += Math.min(mv.power,120)/20;
    if (types.includes(mv.type)) sc += 6;
    if (mv.category==='physical' && prefPhys) sc += 4;
    if (mv.category==='special'  && prefSpec)  sc += 4;
    if (hasAV && mv.category==='status') sc -= 10;
    if (boostedType && mv.type===boostedType) sc += 3;
    if (hasPixilate && mv.type==='normal' && mv.category!=='status') sc += 5;
    if (hasGuts && mv.name==='facade') sc += 8;
    if (hasTech && mv.power>0 && mv.power<=60) sc += 4;
    if (hasSF && mv.flags?.includes('secondary')) sc += 3;
    if (hasSoundItem && mv.flags?.includes('sound')) sc += 5;
    if (hasLoadedD && mv.flags?.includes('multi-hit')) sc += 5;
    if (isChoice && mv.category==='status') sc -= 6;
    if (isChoice && mv.power>=100) sc += 2;
    if (mv.flags?.includes('priority')) sc += 2;
    if (mv.flags?.includes('pivot')) sc += 2;
    if (mv.flags?.includes('drain') && isBulky) sc += 2;
    if (mv.category==='status') {
      if (mv.flags?.includes('setup')) sc += isBulky?3:5;
      if (mv.flags?.includes('recovery') && isBulky) sc += 5;
      if (mv.flags?.includes('hazard')) sc += 4;
      if (mv.name==='spore') sc += 7;
      if (mv.name==='sleep-powder') sc += 4;
      if (mv.name==='will-o-wisp' && isBulky) sc += 4;
      if (mv.name==='thunder-wave') sc += 2;
      if (mv.name==='toxic' && isBulky) sc += 3;
      if (mv.name==='leech-seed' && isBulky) sc += 3;
      if (mv.name==='stealth-rock') sc += 5;
      if (mv.name==='protect') sc += isBulky?3:1;
      if (mv.name==='substitute') sc += 2;
    }
    scored.push({name:mv.name,score:sc});
  }
  scored.sort((a,b)=>b.score-a.score);
  return scored.slice(0,10).map(s=>s.name);
}

// ── Type Effectiveness (Gen 6+) ──────────────────────────────────────────────
const TYPE_EFF: Record<string, Record<string, number>> = {
  normal:   { rock:.5, steel:.5, ghost:0 },
  fire:     { fire:.5, water:.5, rock:.5, dragon:.5, grass:2, ice:2, bug:2, steel:2 },
  water:    { water:.5, grass:.5, dragon:.5, fire:2, ground:2, rock:2 },
  electric: { electric:.5, grass:.5, dragon:.5, ground:0, flying:2, water:2 },
  grass:    { fire:.5, grass:.5, poison:.5, flying:.5, bug:.5, dragon:.5, steel:.5, water:2, ground:2, rock:2 },
  ice:      { fire:.5, water:.5, ice:.5, steel:.5, grass:2, ground:2, flying:2, dragon:2 },
  fighting: { poison:.5, flying:.5, psychic:.5, bug:.5, fairy:.5, ghost:0, normal:2, ice:2, rock:2, dark:2, steel:2 },
  poison:   { poison:.5, ground:.5, rock:.5, ghost:.5, steel:0, grass:2, fairy:2 },
  ground:   { grass:.5, bug:.5, flying:0, fire:2, electric:2, poison:2, rock:2, steel:2 },
  flying:   { electric:.5, rock:.5, steel:.5, grass:2, fighting:2, bug:2 },
  psychic:  { psychic:.5, steel:.5, dark:0, fighting:2, poison:2 },
  bug:      { fire:.5, fighting:.5, flying:.5, ghost:.5, steel:.5, fairy:.5, grass:2, psychic:2, dark:2 },
  rock:     { fighting:.5, ground:.5, steel:.5, fire:2, ice:2, flying:2, bug:2 },
  ghost:    { normal:0, dark:.5, ghost:2, psychic:2 },
  dragon:   { steel:.5, fairy:0, dragon:2 },
  dark:     { fighting:.5, dark:.5, fairy:.5, ghost:2, psychic:2 },
  steel:    { fire:.5, water:.5, electric:.5, steel:.5, ice:2, rock:2, fairy:2 },
  fairy:    { fire:.5, poison:.5, steel:.5, fighting:2, dragon:2, dark:2 },
};

const TYPE_NAMES_ES: Record<string,string> = {
  normal:'Normal',fire:'Fuego',water:'Agua',electric:'Eléctrico',grass:'Planta',
  ice:'Hielo',fighting:'Lucha',poison:'Veneno',ground:'Tierra',flying:'Volador',
  psychic:'Psíquico',bug:'Bicho',rock:'Roca',ghost:'Fantasma',dragon:'Dragón',
  dark:'Siniestro',steel:'Acero',fairy:'Hada',
};

const ALL_TYPES = ['normal','fire','water','electric','grass','ice','fighting',
  'poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'] as const;

function getDefEff(atkType: string, defTypes: string[]): number {
  const row = TYPE_EFF[atkType] ?? {};
  return defTypes.reduce((m, dt) => m * (row[dt] ?? 1), 1);
}

// ── Interfaces ───────────────────────────────────────────────────────────────
interface PickerResult { id:number; name:string; imageUrl:string; }

// ── Analysis interfaces ──────────────────────────────────────────────────────
interface MemberTypeInfo { name: string; types: string[]; }
interface DefStat { type:string; weak:number; quad:number; resist:number; immune:number; neutral:number; }
interface TeamAnalysis {
  memberTypes: MemberTypeInfo[];
  threats:     DefStat[];
  goodResists: DefStat[];
  stabCoverage: string[];
  moveCoverage: string[];
  tips: string[];
}

interface EditForm {
  memberId:number; teamId:number;
  pokemonId:number; pokemonName:string; artworkUrl:string; types:string[];
  availableAbilities:{name:string;nameEs:string;isHidden:boolean}[];
  learnableMoves:string[]; suggestedItems:string[];
  ability:string; nature:string; heldItem:string;
  moves:[string,string,string,string];
  evHp:number; evAtk:number; evDef:number; evSpAtk:number; evSpDef:number; evSpeed:number;
  ivHp:number; ivAtk:number; ivDef:number; ivSpAtk:number; ivSpDef:number; ivSpeed:number;
}

// ── Component ────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Mis Equipos</h1>
        <div class="header-actions">
          <button class="import-btn" (click)="openImportModal()" title="Importar equipo desde archivo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Importar
          </button>
          <button class="create-btn" (click)="openCreateModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M12 5v14M5 12h14"/></svg>
            Nuevo equipo
          </button>
        </div>
      </div>

      <div class="empty-state" *ngIf="teamsService.teams().length === 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" width="64" height="64"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <p>No tienes equipos aún.<br>¡Crea tu primer equipo!</p>
      </div>

      <div class="teams-grid" *ngIf="teamsService.teams().length > 0">
        <div class="team-card" *ngFor="let team of teamsService.teams()">
          <div class="team-header">
            <div class="team-header-left">
              <h3 class="team-name">{{ team.name }}</h3>
              <div class="team-count-pills">
                <span class="count-filled" *ngFor="let s of slots; let i = index"
                  [class.active]="i < team.members.length"></span>
              </div>
            </div>
            <div class="team-meta">
              <span class="team-count-label">{{ team.members.length }}/6</span>
              <button class="icon-btn export" (click)="exportTeam(team)" title="Compartir / Exportar equipo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </button>
              <button class="icon-btn danger" (click)="confirmDeleteTeamId.set(team.id)" title="Eliminar equipo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>

          <div class="team-slots">
            <div class="slot" *ngFor="let slot of slots">
              <ng-container *ngIf="getMember(team, slot) as member; else emptySlot">
                <div class="slot-filled">
                  <button class="slot-remove-x" (click)="removeMember(team.id, member.pokemonId)" title="Quitar">✕</button>
                  <div class="slot-img-wrap">
                    <img [src]="member.pokemonImageUrl" [alt]="member.pokemonName" class="slot-img" />
                  </div>
                  <span class="slot-name">{{ member.pokemonName }}</span>

                  <div class="slot-chips" *ngIf="member.nature || member.ability">
                    <span class="schip nature-chip" *ngIf="member.nature">{{ natureEs(member.nature) }}</span>
                    <span class="schip ability-chip" *ngIf="member.ability">{{ formatName(member.ability) }}</span>
                  </div>

                  <div class="slot-item" *ngIf="member.heldItem">
                    <span class="item-dot"></span>{{ formatName(member.heldItem) }}
                  </div>

                  <div class="slot-moves" *ngIf="member.move1">
                    <span *ngFor="let mv of memberMoves(member)" class="move-pill">{{ formatName(mv) }}</span>
                  </div>

                  <button class="slot-build-btn" (click)="openEdit(team.id, member)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Build
                  </button>
                </div>
              </ng-container>
              <ng-template #emptySlot>
                <div class="slot-empty" (click)="openPicker(team, slot)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  <span>Añadir</span>
                </div>
              </ng-template>
            </div>

          <button class="team-analyze-btn"
            (click)="analyzeTeam(team)"
            [disabled]="analyzingTeam() && analysisTeamId() === team.id">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13">
              <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
            </svg>
            {{ (analyzingTeam() && analysisTeamId() === team.id) ? 'Analizando...' : 'Analizar equipo' }}
          </button>
        </div>
      </div>
    </div>

    <!-- IMPORT MODAL -->
    <div class="overlay" *ngIf="showImportModal()" (click)="closeImportModal()">
      <div class="modal import-modal" (click)="$event.stopPropagation()">
        <h3 class="modal-title">Importar equipo</h3>

        <!-- File drop zone (no preview yet) -->
        <ng-container *ngIf="!importPreview()">
          <div class="drop-zone"
               [class.drag-over]="dragOver()"
               (dragover)="$event.preventDefault(); dragOver.set(true)"
               (dragleave)="dragOver.set(false)"
               (drop)="onFileDrop($event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p class="drop-text">Arrastra aquí el archivo<br>o haz clic para buscarlo</p>
            <label class="file-label">
              Seleccionar archivo
              <input type="file" accept=".json" class="file-input" (change)="onFileSelect($event)" />
            </label>
          </div>
          <p class="import-error" *ngIf="importError()">{{ importError() }}</p>
        </ng-container>

        <!-- Preview -->
        <ng-container *ngIf="importPreview() as prev">
          <div class="import-preview">
            <div class="preview-name">
              <span class="preview-label">Equipo</span>
              <strong>{{ prev.name }}</strong>
            </div>
            <div class="preview-members">
              <div class="preview-member" *ngFor="let m of prev.members">
                <img [src]="m.pokemonImageUrl" [alt]="m.pokemonName" class="preview-sprite"
                     (error)="onImgError($event)" />
                <div class="preview-info">
                  <span class="preview-pname">{{ formatName(m.pokemonName) }}</span>
                  <span class="preview-meta" *ngIf="m.heldItem || m.nature">
                    {{ m.nature ? natureEs(m.nature) : '' }}{{ m.heldItem ? ' · ' + formatName(m.heldItem) : '' }}
                  </span>
                  <span class="preview-moves" *ngIf="m.move1">
                    {{ movesDisplay(m.move1,m.move2,m.move3,m.move4) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p class="import-error" *ngIf="importError()">{{ importError() }}</p>
        </ng-container>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeImportModal()">Cancelar</button>
          <button *ngIf="importPreview()" class="btn-primary"
                  (click)="confirmImport()" [disabled]="importing()">
            {{ importing() ? 'Importando...' : 'Importar equipo' }}
          </button>
        </div>
      </div>
    </div>

    <!-- CREATE MODAL -->
    <div class="overlay" *ngIf="showCreateModal()" (click)="showCreateModal.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3 class="modal-title">Crear equipo</h3>
        <input class="modal-input" [(ngModel)]="newTeamName" placeholder="Nombre del equipo..." (keydown.enter)="createTeam()" autofocus />
        <div class="modal-footer">
          <button class="btn-cancel" (click)="showCreateModal.set(false)">Cancelar</button>
          <button class="btn-primary" (click)="createTeam()" [disabled]="!newTeamName.trim()">Crear</button>
        </div>
      </div>
    </div>

    <!-- DELETE CONFIRM -->
    <div class="overlay" *ngIf="confirmDeleteTeamId() !== null" (click)="confirmDeleteTeamId.set(null)">
      <div class="modal confirm-modal" (click)="$event.stopPropagation()">
        <div class="confirm-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="28" height="28"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></div>
        <h3 class="confirm-title">Eliminar equipo</h3>
        <p class="confirm-msg">Se eliminará el equipo y todos sus Pokémon configurados.</p>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="confirmDeleteTeamId.set(null)">Cancelar</button>
          <button class="btn-danger" (click)="doDeleteTeam()">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- POKEMON PICKER -->
    <div class="overlay" *ngIf="showPicker()" (click)="closePicker()">
      <div class="picker-modal" (click)="$event.stopPropagation()">
        <div class="picker-header">
          <h3 class="modal-title">Elegir Pokémon — Slot {{ activeSlot() }}</h3>
          <button class="close-x" (click)="closePicker()">✕</button>
        </div>
        <div class="picker-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" width="15" height="15" class="search-icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="picker-input" [(ngModel)]="pickerQuery" (ngModelChange)="onPickerSearch($event)" placeholder="Nombre o número..." autofocus />
        </div>
        <div class="picker-loading" *ngIf="pickerLoading()"><div class="mini-spin"></div></div>
        <div class="picker-results" *ngIf="!pickerLoading()">
          <div class="picker-item" *ngFor="let p of pickerResults()" (click)="selectPokemon(p)" [class.already-in]="isInTeam(p.id)">
            <img [src]="p.imageUrl" [alt]="p.name" class="picker-img" />
            <div class="picker-info">
              <span class="picker-name">{{ p.name }}</span>
              <span class="picker-id">#{{ p.id | number:'3.0-0' }}</span>
            </div>
            <span class="in-team-tag" *ngIf="isInTeam(p.id)">Ya está</span>
          </div>
          <div class="picker-hint" *ngIf="pickerResults().length === 0">
            {{ pickerQuery.length > 0 ? 'No se encontró "' + pickerQuery + '"' : 'Escribe el nombre o número del Pokémon.' }}
          </div>
        </div>
        <div class="picker-adding" *ngIf="addingMember()"><div class="mini-spin"></div><span>Añadiendo...</span></div>
      </div>
    </div>

    <!-- BUILD PAYWALL MODAL -->
    <div class="overlay" *ngIf="showBuildPaywall()" (click)="showBuildPaywall.set(false)">
      <div class="edit-modal paywall-modal" (click)="$event.stopPropagation()">
        <div class="paywall-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>
        <h2 class="paywall-title">Función Premium</h2>
        <p class="paywall-msg">
          El <strong>Build de Pokémon</strong> (objeto, movimientos, EVs, IVs, habilidad y naturaleza)
          es una función exclusiva de <strong>Premium</strong>.<br><br>
          <strong>3 días gratis</strong> para probarlo sin compromiso.<br>
          Luego desde <strong>$1/mes</strong> o <strong>$10/año</strong> con 1 mes gratis incluido.
        </p>
        <div class="paywall-actions">
          <button class="pw-cancel" (click)="showBuildPaywall.set(false)">Cancelar</button>
          <a routerLink="/subscription" class="pw-upgrade" (click)="showBuildPaywall.set(false)">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            Ver Premium
          </a>
        </div>
      </div>
    </div>

    <!-- ANALYSIS MODAL -->
    <div class="overlay" *ngIf="analysisTeamId() !== null" (click)="closeAnalysis()">
      <div class="analysis-modal" (click)="$event.stopPropagation()">

        <div class="an-header">
          <div class="an-header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
              <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
            </svg>
            <div>
              <div class="an-label">Análisis del equipo</div>
              <div class="an-team-name">{{ getAnalysisTeamName() }}</div>
            </div>
          </div>
          <button class="close-x an-close" (click)="closeAnalysis()">✕</button>
        </div>

        <div class="an-loading" *ngIf="analyzingTeam()">
          <div class="mini-spin"></div><span>Analizando equipo...</span>
        </div>

        <div class="an-body" *ngIf="!analyzingTeam() && teamAnalysis() as ta">

          <!-- Tipos del equipo -->
          <div class="an-section">
            <div class="an-stitle">Tipos del equipo</div>
            <div class="an-members-row">
              <div class="an-member" *ngFor="let mt of ta.memberTypes">
                <span class="an-mname">{{ mt.name }}</span>
                <div class="an-mtypes">
                  <span class="type-pill small-tp" *ngFor="let t of mt.types" [style.background]="typeColor(t)">{{ typeNameEs(t) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Amenazas defensivas -->
          <div class="an-section" *ngIf="ta.threats.length > 0">
            <div class="an-stitle">Amenazas al equipo</div>
            <div class="an-legend">
              <span class="adot adot-quad"></span><span>×4 débil</span>
              <span class="adot adot-weak"></span><span>×2 débil</span>
              <span class="adot adot-res"></span><span>Resistente</span>
              <span class="adot adot-imm"></span><span>Inmune</span>
              <span class="adot adot-neu"></span><span>Neutro</span>
            </div>
            <div class="an-threats-grid">
              <div class="an-threat-row" *ngFor="let d of ta.threats"
                [class.t-crit]="d.weak >= 3" [class.t-notable]="d.weak === 2">
                <span class="type-pill small-tp" [style.background]="typeColor(d.type)">{{ typeNameEs(d.type) }}</span>
                <div class="an-dots">
                  <span class="adot adot-quad" *ngFor="let i of arrayOf(d.quad)" title="×4 débil"></span>
                  <span class="adot adot-weak" *ngFor="let i of arrayOf(d.weak - d.quad)" title="×2 débil"></span>
                  <span class="adot adot-res"  *ngFor="let i of arrayOf(d.resist)" title="Resistente"></span>
                  <span class="adot adot-imm"  *ngFor="let i of arrayOf(d.immune)" title="Inmune"></span>
                  <span class="adot adot-neu"  *ngFor="let i of arrayOf(d.neutral)" title="Neutro"></span>
                </div>
                <span class="an-weak-badge" [class.badge-crit]="d.weak >= 3">{{ d.weak }}×</span>
              </div>
            </div>
          </div>

          <!-- Buenas resistencias -->
          <div class="an-section" *ngIf="ta.goodResists.length > 0">
            <div class="an-stitle">Buenas resistencias del equipo</div>
            <div class="an-types-row">
              <span class="type-pill" *ngFor="let d of ta.goodResists" [style.background]="typeColor(d.type)">{{ typeNameEs(d.type) }}</span>
            </div>
          </div>

          <!-- Cobertura ofensiva -->
          <div class="an-section">
            <div class="an-stitle">Cobertura ofensiva</div>
            <div class="an-cov-block">
              <div class="an-cov-row" *ngIf="ta.stabCoverage.length > 0">
                <span class="an-cov-lbl">STAB</span>
                <div class="an-types-row">
                  <span class="type-pill" *ngFor="let t of ta.stabCoverage" [style.background]="typeColor(t)">{{ typeNameEs(t) }}</span>
                </div>
              </div>
              <div class="an-cov-row" *ngIf="ta.moveCoverage.length > 0">
                <span class="an-cov-lbl">Movimientos</span>
                <div class="an-types-row">
                  <span class="type-pill" *ngFor="let t of ta.moveCoverage" [style.background]="typeColor(t)">{{ typeNameEs(t) }}</span>
                </div>
              </div>
              <div class="an-empty" *ngIf="ta.stabCoverage.length === 0 && ta.moveCoverage.length === 0">
                Añade Pokémon al equipo para ver la cobertura.
              </div>
            </div>
          </div>

          <!-- Consejos -->
          <div class="an-section">
            <div class="an-stitle">Consejos para mejorar el equipo</div>
            <div class="an-tips">
              <div class="an-tip" *ngFor="let tip of ta.tips">{{ tip }}</div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- EDIT BUILD MODAL -->
    <div class="overlay" *ngIf="editForm()" (click)="closeEdit()">
      <div class="edit-modal" (click)="$event.stopPropagation()">
        <div class="edit-loading" *ngIf="editLoading()">
          <div class="mini-spin"></div><span>Cargando datos...</span>
        </div>

        <ng-container *ngIf="!editLoading() && editForm() as ef">
          <div class="edit-header">
            <img [src]="ef.artworkUrl" [alt]="ef.pokemonName" class="edit-artwork" />
            <div class="edit-header-info">
              <h2 class="edit-poke-name">{{ ef.pokemonName }}</h2>
              <div class="edit-types">
                <span class="type-pill" *ngFor="let t of ef.types" [style.background]="typeColor(t)">{{ t }}</span>
              </div>
            </div>
            <button class="close-x" (click)="closeEdit()">✕</button>
          </div>

          <div class="edit-body">

            <!-- HABILIDAD -->
            <div class="edit-section">
              <div class="edit-section-title">Habilidad</div>
              <div class="ability-pills">
                <button *ngFor="let ab of ef.availableAbilities" class="ability-pill"
                  [class.active]="ef.ability === ab.name" (click)="setField('ability', ab.name)">
                  {{ ab.nameEs }}<span class="hidden-tag" *ngIf="ab.isHidden">Oculta</span>
                </button>
              </div>
            </div>

            <!-- NATURALEZA + OBJETO -->
            <div class="edit-row-2">
              <div class="edit-section">
                <div class="edit-section-title">Naturaleza</div>
                <select class="edit-select" [ngModel]="ef.nature" (ngModelChange)="setField('nature', $event)">
                  <option value="">— Sin elegir —</option>
                  <option *ngFor="let n of natures" [value]="n.name">
                    {{ n.es }}{{ n.plus ? ' (+' + statShort(n.plus) + ' / -' + statShort(n.minus!) + ')' : '' }}
                  </option>
                </select>
              </div>
              <div class="edit-section">
                <div class="edit-section-title">Objeto equipado</div>
                <div class="item-input-wrap">
                  <input class="edit-input item-search-input" [value]="ef.heldItem"
                    (input)="onItemInput($any($event.target).value)"
                    (focus)="showItemDropdown.set(true)" (blur)="onItemBlur()"
                    placeholder="Buscar objeto..." autocomplete="off" />
                  <button class="item-clear-btn" *ngIf="ef.heldItem" (mousedown)="clearItem()">✕</button>
                </div>
              </div>
            </div>

            <!-- ITEM SUGGESTIONS -->
            <div class="suggestions-panel item-panel" *ngIf="showItemDropdown() && (filteredRecommended().length > 0 || filteredOther().length > 0)">
              <ng-container *ngIf="filteredRecommended().length > 0">
                <div class="panel-header item-header">
                  <svg viewBox="0 0 24 24" fill="#f59e0b" width="12" height="12"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  Recomendados para este Pokémon
                </div>
                <div class="chips-grid">
                  <button class="chip item-chip recommended" *ngFor="let item of filteredRecommended()"
                    (mousedown)="selectItem(item)" [class.selected]="ef.heldItem === item.display">
                    <span class="chip-name">{{ item.display }}</span>
                    <span class="chip-badge" [style.background]="catColor(item.category)">{{ catLabel(item.category) }}</span>
                  </button>
                </div>
              </ng-container>
              <ng-container *ngIf="filteredOther().length > 0">
                <div class="panel-divider" *ngIf="filteredRecommended().length > 0"></div>
                <div class="panel-header item-header">Todos los objetos</div>
                <div class="chips-grid">
                  <button class="chip item-chip" *ngFor="let item of filteredOther()"
                    (mousedown)="selectItem(item)" [class.selected]="ef.heldItem === item.display">
                    <span class="chip-name">{{ item.display }}</span>
                    <span class="chip-badge" [style.background]="catColor(item.category)">{{ catLabel(item.category) }}</span>
                  </button>
                </div>
              </ng-container>
            </div>

            <!-- MOVIMIENTOS -->
            <div class="edit-section">
              <div class="edit-section-title">Movimientos</div>
              <div class="moves-grid">
                <div class="move-slot" *ngFor="let i of [0,1,2,3]">
                  <div class="move-input-wrap">
                    <input class="edit-input move-input" [value]="ef.moves[i]"
                      (input)="onMoveInput(i, $any($event.target).value)"
                      (focus)="onMoveFocus(i)" (blur)="onMoveBlur()"
                      [placeholder]="'Movimiento ' + (i+1)" autocomplete="off" />
                    <button class="move-clear" *ngIf="ef.moves[i]" (mousedown)="setMove(i, '')">✕</button>
                  </div>
                </div>
              </div>

              <!-- MOVE SUGGESTIONS (inline, reactive to ability/item/EVs) -->
              <div class="suggestions-panel move-panel"
                *ngIf="activeMoveSlot() >= 0 && (filteredRecommendedMoves().length > 0 || filteredOtherMoves().length > 0)">
                <ng-container *ngIf="filteredRecommendedMoves().length > 0">
                  <div class="panel-header move-header">
                    <svg viewBox="0 0 24 24" fill="#a855f7" width="12" height="12"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Recomendados · Slot {{ activeMoveSlot() + 1 }}
                    <span class="synergy-note">sinergia con habilidad, objeto y EVs</span>
                  </div>
                  <div class="chips-grid">
                    <button class="chip move-chip recommended" *ngFor="let mv of filteredRecommendedMoves()"
                      (mousedown)="setMoveFromSuggestion(mv.name)"
                      [class.selected]="ef.moves[activeMoveSlot()] === mv.name"
                      [class.already-used]="isMoveUsedElsewhere(mv.name)">
                      <span class="move-type-dot" [style.background]="typeColor(mv.type)"></span>
                      <span class="chip-name">{{ formatName(mv.name) }}</span>
                      <span class="chip-badge" [style.background]="moveCatColor(mv.category)">{{ moveCatLabel(mv.category) }}</span>
                    </button>
                  </div>
                </ng-container>
                <ng-container *ngIf="filteredOtherMoves().length > 0">
                  <div class="panel-divider" *ngIf="filteredRecommendedMoves().length > 0"></div>
                  <div class="panel-header move-header">Todos los movimientos</div>
                  <div class="chips-grid">
                    <button class="chip move-chip" *ngFor="let name of filteredOtherMoves()"
                      (mousedown)="setMoveFromSuggestion(name)"
                      [class.selected]="ef.moves[activeMoveSlot()] === name">
                      <ng-container *ngIf="getMoveEntry(name) as md">
                        <span class="move-type-dot" [style.background]="typeColor(md.type)"></span>
                      </ng-container>
                      <span class="chip-name">{{ formatName(name) }}</span>
                      <ng-container *ngIf="getMoveEntry(name) as md">
                        <span class="chip-badge" [style.background]="moveCatColor(md.category)">{{ moveCatLabel(md.category) }}</span>
                      </ng-container>
                    </button>
                  </div>
                </ng-container>
              </div>
            </div>

            <!-- EVs -->
            <div class="edit-section">
              <div class="edit-section-title-row">
                <span class="edit-section-title">EVs</span>
                <span class="ev-total" [class.over]="evTotal() > 510">{{ evTotal() }} / 510</span>
              </div>
              <div class="ev-bar-total">
                <div class="ev-bar-fill" [style.width.%]="Math.min(evTotal()/510*100,100)" [class.over]="evTotal() > 510"></div>
              </div>
              <div class="stat-grid">
                <div class="stat-row-ev" *ngFor="let k of statKeys">
                  <span class="stat-label">{{ statLabel(k) }}</span>
                  <input class="stat-input" type="number" min="0" max="252"
                    [ngModel]="getEv(k)" (ngModelChange)="setEv(k, $event)" />
                  <div class="ev-mini-bar-bg"><div class="ev-mini-bar" [style.width.%]="getEv(k)/252*100"></div></div>
                </div>
              </div>
            </div>

            <!-- IVs -->
            <div class="edit-section">
              <div class="edit-section-title">IVs</div>
              <div class="iv-grid">
                <div class="iv-cell" *ngFor="let k of ivKeys">
                  <span class="stat-label">{{ statLabel(k) }}</span>
                  <input class="stat-input iv-input" type="number" min="0" max="31"
                    [ngModel]="getIv(k)" (ngModelChange)="setIv(k, $event)" />
                </div>
              </div>
            </div>

          </div>

          <div class="edit-footer">
            <button class="btn-cancel" (click)="closeEdit()">Cancelar</button>
            <button class="btn-primary" (click)="saveEdit()" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Guardar build' }}
            </button>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    /* ── Page layout ─────────────────────────────────────────────────────── */
    .page { padding: 2rem; max-width: 1200px; margin: 0 auto; box-sizing: border-box; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: .75rem; }
    @media (max-width: 480px) {
      .page { padding: 1rem; }
    }
    .page-title { font-size:1.8rem;font-weight:800;color:#1a1a2e;margin:0; }
    .header-actions { display:flex;align-items:center;gap:.5rem; }
    .create-btn { display:flex;align-items:center;gap:.4rem;padding:.6rem 1.2rem;background:#e63946;color:white;border:none;border-radius:12px;font-weight:700;font-size:.88rem;cursor:pointer;transition:background .2s;box-shadow:0 2px 8px rgba(230,57,70,.25); }
    .create-btn:hover { background:#c1121f; }
    .import-btn { display:flex;align-items:center;gap:.4rem;padding:.58rem 1rem;background:white;color:#555;border:1.5px solid #e8e8e8;border-radius:12px;font-weight:700;font-size:.85rem;cursor:pointer;transition:all .2s; }
    .import-btn:hover { border-color:#1976d2;color:#1976d2;background:#f0f6ff; }
    .empty-state { text-align:center;padding:5rem 1rem;color:#bbb;display:flex;flex-direction:column;align-items:center;gap:1rem;font-size:.95rem;line-height:1.6; }

    /* ── Team grid ────────────────────────────────────────────────────────── */
    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr));
      gap: 1.5rem;
    }

    /* ── Team card ────────────────────────────────────────────────────────── */
    .team-card {
      background: white; border-radius: 20px;
      padding: 1.4rem 1.4rem 1.25rem;
      box-shadow: 0 2px 16px rgba(0,0,0,.07);
      border: 1px solid #f0f0f0;
      transition: box-shadow .2s;
      min-width: 0; /* prevent grid blowout */
    }
    .team-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.1); }

    /* ── Team header ─────────────────────────────────────────────────────── */
    .team-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.1rem; }
    .team-header-left { display:flex;flex-direction:column;gap:.4rem; }
    .team-name { font-size:1.1rem;font-weight:800;color:#1a1a2e;margin:0; }
    .team-count-pills { display:flex;gap:.25rem; }
    .count-filled { width:18px;height:5px;border-radius:999px;background:#e8e8e8;transition:background .2s; }
    .count-filled.active { background:#e63946; }
    .team-meta { display:flex;align-items:center;gap:.5rem; }
    .team-count-label { font-size:.75rem;color:#aaa;font-weight:700;background:#f5f5f7;padding:.2rem .55rem;border-radius:999px; }
    .icon-btn { background:none;border:none;cursor:pointer;padding:.35rem;border-radius:8px;color:#d0d0d0;transition:all .2s;display:flex; }
    .icon-btn.danger:hover { background:rgba(230,57,70,.1);color:#e63946; }
    .icon-btn.export:hover { background:rgba(25,118,210,.1);color:#1976d2; }

    /* ── Slots grid ──────────────────────────────────────────────────────── */
    .team-slots {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: .65rem;
    }
    /* Collapse to 2 columns when the card is narrow (container queries fallback via media) */
    @media (max-width: 520px) {
      .team-slots { grid-template-columns: repeat(2, 1fr); }
    }

    /* ── Empty slot ──────────────────────────────────────────────────────── */
    .slot-empty {
      border-radius: 14px; min-height: 160px;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .35rem;
      border: 2px dashed #e4e4e4; color: #ccc;
      cursor: pointer; transition: all .18s;
      font-size: .7rem; font-weight: 600; letter-spacing: .2px;
    }
    .slot-empty:hover { border-color: #e63946; color: #e63946; background: rgba(230,57,70,.03); }

    /* ── Filled slot ─────────────────────────────────────────────────────── */
    .slot-filled {
      border-radius: 14px; padding: .75rem .6rem .65rem;
      background: #fafafa; border: 1px solid #f0f0f0;
      display: flex; flex-direction: column; align-items: center; gap: .3rem;
      position: relative; min-width: 0; overflow: hidden;
    }
    .slot-remove-x {
      position:absolute;top:.4rem;right:.4rem;
      background:none;border:none;cursor:pointer;
      font-size:.65rem;color:#d0d0d0;line-height:1;
      padding:.2rem; border-radius:50%;
      transition:all .15s;
    }
    .slot-remove-x:hover { color:#e63946;background:rgba(230,57,70,.1); }

    .slot-img-wrap { width:clamp(56px,100%,80px);aspect-ratio:1;display:flex;align-items:center;justify-content:center; }
    .slot-img { width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,.12)); }

    .slot-name {
      font-size: .72rem; font-weight: 700;
      text-transform: capitalize; color: #1a1a2e;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      width: 100%; text-align: center;
    }

    /* ── Build chips (nature + ability) ─────────────────────────────────── */
    .slot-chips { display: flex; flex-wrap: wrap; gap: .2rem; justify-content: center; width: 100%; }
    .schip {
      font-size: .56rem; font-weight: 700; padding: .15rem .38rem;
      border-radius: 999px; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; max-width: 100%;
    }
    .nature-chip  { background: #eef2ff; color: #4338ca; }
    .ability-chip { background: #f0fdf4; color: #166534; }

    /* ── Item ────────────────────────────────────────────────────────────── */
    .slot-item {
      display: flex; align-items: center; gap: .3rem;
      font-size: .6rem; font-weight: 600; color: #b45309;
      background: #fffbeb; border: 1px solid #fde68a;
      padding: .15rem .45rem; border-radius: 999px;
      width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      justify-content: center;
    }
    .item-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; flex-shrink: 0; }

    /* ── Moves ───────────────────────────────────────────────────────────── */
    .slot-moves { display: grid; grid-template-columns: 1fr 1fr; gap: .18rem; width: 100%; }
    .move-pill {
      font-size: .55rem; color: #555; font-weight: 600;
      background: #f0f0f0; border-radius: 4px;
      padding: .15rem .25rem; text-transform: capitalize;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      text-align: center; min-width: 0;
    }

    /* ── Build button ────────────────────────────────────────────────────── */
    .slot-build-btn {
      display: flex; align-items: center; justify-content: center; gap: .3rem;
      padding: .35rem .5rem; margin-top: .15rem;
      background: #1a1a2e; color: white;
      border: none; border-radius: 8px;
      font-size: .68rem; font-weight: 700; cursor: pointer;
      transition: all .18s; width: 100%;
    }
    .slot-build-btn:hover { background: #2e2e50; }

    /* PAYWALL */
    .paywall-modal { max-width:400px!important;text-align:center;padding:2.5rem 2rem!important;background:white;border-radius:20px; }
    .paywall-icon { color:#fbbf24;margin-bottom:1rem; }
    .paywall-title { font-size:1.2rem;font-weight:800;color:#1a1a2e;margin:0 0 .75rem; }
    .paywall-msg { font-size:.88rem;color:#555;line-height:1.65;margin:0 0 1.75rem; }
    .paywall-actions { display:flex;gap:.75rem;justify-content:center; }
    .pw-cancel { padding:.55rem 1.1rem;background:#f0f0f0;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer;color:#555;transition:background .2s; }
    .pw-cancel:hover { background:#e0e0e0; }
    .pw-upgrade { display:inline-flex;align-items:center;gap:.4rem;padding:.55rem 1.4rem;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1a1a2e;border:none;border-radius:10px;font-size:.88rem;font-weight:800;cursor:pointer;text-decoration:none;transition:all .2s; }
    .pw-upgrade:hover { transform:translateY(-1px);box-shadow:0 4px 14px rgba(251,191,36,.4); }

    /* OVERLAY / MODALS */
    .overlay { position:fixed;inset:0;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;z-index:300;padding:1rem; }
    .modal { background:white;border-radius:20px;padding:2rem;width:90%;max-width:420px;box-shadow:0 24px 64px rgba(0,0,0,.25); }
    .import-modal { max-width:520px; }
    .modal-title { font-size:1.1rem;font-weight:800;color:#1a1a2e;margin:0 0 1.25rem; }

    /* Import drop zone */
    .drop-zone { border:2px dashed #e0e0e8;border-radius:14px;padding:2rem 1.5rem;display:flex;flex-direction:column;align-items:center;gap:.75rem;cursor:pointer;transition:border-color .2s,background .2s;color:#bbb;text-align:center; }
    .drop-zone.drag-over { border-color:#1976d2;background:rgba(25,118,210,.04); }
    .drop-text { font-size:.88rem;color:#888;line-height:1.5;margin:0; }
    .file-label { display:inline-flex;align-items:center;gap:.4rem;padding:.4rem 1rem;background:#f0f0f5;border-radius:8px;font-size:.82rem;font-weight:600;color:#555;cursor:pointer;transition:background .18s; }
    .file-label:hover { background:#e4e4ef; }
    .file-input { display:none; }
    .import-error { font-size:.82rem;color:#e63946;margin:.5rem 0 0;text-align:center; }

    /* Import preview */
    .import-preview { background:#f9f9fb;border-radius:12px;padding:1rem 1.1rem; }
    .preview-name { display:flex;align-items:center;gap:.5rem;margin-bottom:.85rem;font-size:.9rem; }
    .preview-label { font-size:.72rem;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.4px; }
    .preview-members { display:flex;flex-direction:column;gap:.55rem; }
    .preview-member { display:flex;align-items:center;gap:.75rem; }
    .preview-sprite { width:44px;height:44px;object-fit:contain;flex-shrink:0; }
    .preview-info { display:flex;flex-direction:column;gap:.08rem;min-width:0; }
    .preview-pname { font-size:.85rem;font-weight:700;color:#1a1a2e;text-transform:capitalize; }
    .preview-meta { font-size:.72rem;color:#888; }
    .preview-moves { font-size:.68rem;color:#aaa; }
    .modal-input { width:100%;padding:.65rem .9rem;border:2px solid #eee;border-radius:10px;font-size:.92rem;outline:none;transition:border .2s;box-sizing:border-box; }
    .modal-input:focus { border-color:#e63946; }
    .modal-footer { display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem; }
    .btn-cancel { padding:.5rem 1.1rem;background:#f0f0f0;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer;color:#555;transition:background .2s; }
    .btn-cancel:hover { background:#e0e0e0; }
    .btn-primary { padding:.5rem 1.3rem;background:#e63946;color:white;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer;transition:background .2s; }
    .btn-primary:disabled { opacity:.5;cursor:not-allowed; }
    .btn-primary:hover:not(:disabled) { background:#c1121f; }
    .btn-danger { padding:.5rem 1.3rem;background:#e63946;color:white;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer; }
    .btn-danger:hover { background:#c1121f; }
    .confirm-modal { text-align:center;max-width:360px; }
    .confirm-icon { width:56px;height:56px;border-radius:50%;background:rgba(230,57,70,.1);color:#e63946;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem; }
    .confirm-title { font-size:1.1rem;font-weight:800;color:#1a1a2e;margin:0 0 .5rem; }
    .confirm-msg { font-size:.85rem;color:#888;margin:0 0 1.5rem;line-height:1.5; }

    /* PICKER */
    .picker-modal { background:white;border-radius:20px;width:100%;max-width:440px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.25);overflow:hidden; }
    .picker-header { display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem .5rem; }
    .close-x { background:none;border:none;cursor:pointer;font-size:1.1rem;color:#aaa;line-height:1;padding:.3rem;transition:color .15s; }
    .close-x:hover { color:#1a1a2e; }
    .picker-search { position:relative;padding:.5rem 1.25rem; }
    .search-icon { position:absolute;left:2rem;top:50%;transform:translateY(-50%); }
    .picker-input { width:100%;padding:.6rem .9rem .6rem 2.4rem;border:2px solid #eee;border-radius:10px;font-size:.9rem;outline:none;transition:border .2s;box-sizing:border-box; }
    .picker-input:focus { border-color:#e63946; }
    .picker-loading,.picker-adding { display:flex;align-items:center;justify-content:center;gap:.6rem;padding:1.5rem;color:#888;font-size:.88rem; }
    .picker-results { overflow-y:auto;flex:1;padding:.25rem .75rem .75rem; }
    .picker-item { display:flex;align-items:center;gap:.75rem;padding:.45rem .75rem;border-radius:10px;cursor:pointer;transition:background .15s; }
    .picker-item:hover:not(.already-in) { background:#fafafa; }
    .picker-item.already-in { opacity:.45;cursor:not-allowed; }
    .picker-img { width:52px;height:52px;object-fit:contain;flex-shrink:0; }
    .picker-info { flex:1; }
    .picker-name { display:block;text-transform:capitalize;font-weight:600;font-size:.88rem;color:#1a1a2e; }
    .picker-id { font-size:.73rem;color:#aaa; }
    .in-team-tag { font-size:.68rem;padding:.18rem .45rem;background:#f0f0f0;color:#888;border-radius:999px;font-weight:600; }
    .picker-hint { text-align:center;padding:2rem;color:#bbb;font-size:.88rem; }
    .mini-spin { width:22px;height:22px;border-radius:50%;border:3px solid #f0f0f0;border-top-color:#e63946;animation:spin .8s linear infinite;flex-shrink:0; }
    @keyframes spin { to { transform:rotate(360deg) } }

    /* EDIT MODAL */
    .edit-modal { background:white;border-radius:20px;width:100%;max-width:640px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.3);overflow:hidden; }
    .edit-loading { display:flex;align-items:center;justify-content:center;gap:.75rem;padding:3rem;color:#888;font-size:.9rem; }
    .edit-header { display:flex;align-items:center;gap:1rem;padding:1.25rem 1.5rem;background:#f8f9fb;border-bottom:1px solid #f0f0f0;flex-shrink:0; }
    .edit-artwork { width:72px;height:72px;object-fit:contain;flex-shrink:0; }
    .edit-header-info { flex:1; }
    .edit-poke-name { font-size:1.25rem;font-weight:800;color:#1a1a2e;margin:0 0 .35rem;text-transform:capitalize; }
    .edit-types { display:flex;gap:.35rem; }
    .type-pill { font-size:.7rem;font-weight:700;padding:.2rem .6rem;border-radius:999px;color:white;text-transform:capitalize; }
    .edit-body { overflow-y:auto;flex:1;padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1.25rem; }
    .edit-section { display:flex;flex-direction:column;gap:.6rem; }
    .edit-section-title { font-size:.72rem;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.5px; }
    .edit-section-title-row { display:flex;align-items:center;justify-content:space-between; }
    .ev-total { font-size:.78rem;font-weight:700;color:#1976d2; }
    .ev-total.over { color:#e63946; }
    .edit-row-2 { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }
    @media(max-width:500px){ .edit-row-2{grid-template-columns:1fr} }
    .ability-pills { display:flex;flex-wrap:wrap;gap:.5rem; }
    .ability-pill { display:flex;align-items:center;gap:.35rem;padding:.4rem .85rem;border:2px solid #e8e8e8;border-radius:999px;background:white;font-size:.82rem;font-weight:600;color:#555;cursor:pointer;transition:all .15s;text-transform:capitalize; }
    .ability-pill:hover { border-color:#1976d2;color:#1976d2; }
    .ability-pill.active { background:#1976d2;border-color:#1976d2;color:white; }
    .hidden-tag { font-size:.62rem;padding:.1rem .35rem;background:rgba(255,255,255,.3);border-radius:999px;font-weight:700; }
    .ability-pill:not(.active) .hidden-tag { background:rgba(230,57,70,.12);color:#e63946; }
    .edit-select,.edit-input { width:100%;padding:.55rem .75rem;border:1.5px solid #e8e8e8;border-radius:10px;font-size:.85rem;outline:none;transition:border .2s;background:white;box-sizing:border-box; }
    .edit-select:focus,.edit-input:focus { border-color:#1976d2; }

    /* ITEM INPUT */
    .item-input-wrap { position:relative; }
    .item-search-input { padding-right:1.8rem; }
    .item-clear-btn { position:absolute;right:.5rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#bbb;font-size:.8rem;padding:0;line-height:1; }
    .item-clear-btn:hover { color:#e63946; }

    /* SHARED SUGGESTION PANELS */
    .suggestions-panel { border-radius:14px;padding:.85rem;display:flex;flex-direction:column;gap:.65rem; }
    .item-panel { border:1.5px solid #fde68a;background:#fffbeb; }
    .move-panel { border:1.5px solid #e9d5ff;background:#faf5ff; }
    .panel-header { display:flex;align-items:center;gap:.35rem;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px; }
    .item-header { color:#92400e; }
    .move-header { color:#6b21a8; }
    .synergy-note { font-size:.58rem;font-weight:500;opacity:.7;text-transform:none;letter-spacing:0;margin-left:.25rem; }
    .panel-divider { height:1px;background:#e5e7eb;margin:.1rem 0; }
    .chips-grid { display:flex;flex-wrap:wrap;gap:.35rem; }

    /* SHARED CHIP */
    .chip { display:inline-flex;align-items:center;gap:.3rem;padding:.28rem .65rem;border:1.5px solid #e5e7eb;border-radius:999px;background:white;cursor:pointer;font-size:.77rem;font-weight:600;color:#374151;transition:all .15s;line-height:1.2; }
    .chip.selected { color:white; }
    .chip-name { text-transform:capitalize; }
    .chip-badge { font-size:.6rem;font-weight:700;padding:.1rem .3rem;border-radius:999px;color:white;flex-shrink:0; }

    /* ITEM CHIPS */
    .item-chip { }
    .item-chip:hover { border-color:#f59e0b;color:#92400e;background:#fef3c7; }
    .item-chip.selected { background:#f59e0b;border-color:#f59e0b; }
    .item-chip.recommended { border-color:#fbbf24; }

    /* MOVE CHIPS */
    .move-chip { }
    .move-chip:hover { border-color:#7c3aed;color:#5b21b6;background:#f5f3ff; }
    .move-chip.selected { background:#7c3aed;border-color:#7c3aed; }
    .move-chip.recommended { border-color:#c4b5fd; }
    .move-chip.recommended:hover { background:#ede9fe; }
    .move-chip.already-used { opacity:.45; }
    .move-type-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }

    /* MOVES GRID */
    .moves-grid { display:grid;grid-template-columns:1fr 1fr;gap:.6rem; }
    @media(max-width:480px){ .moves-grid{grid-template-columns:1fr} }
    .move-slot { position:relative; }
    .move-input-wrap { position:relative; }
    .move-input { padding-right:1.8rem; }
    .move-clear { position:absolute;right:.5rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#bbb;font-size:.8rem;padding:0;line-height:1; }
    .move-clear:hover { color:#e63946; }

    /* EVs / IVs */
    .stat-grid { display:flex;flex-direction:column;gap:.45rem; }
    .stat-row-ev { display:flex;align-items:center;gap:.6rem; }
    .stat-label { font-size:.75rem;color:#888;width:70px;flex-shrink:0; }
    .stat-input { width:52px;flex-shrink:0;padding:.3rem .4rem;border:1.5px solid #e8e8e8;border-radius:8px;font-size:.82rem;font-weight:700;text-align:center;outline:none;transition:border .2s; }
    .stat-input:focus { border-color:#1976d2; }
    .ev-mini-bar-bg { flex:1;height:6px;background:#f0f0f0;border-radius:999px;overflow:hidden; }
    .ev-mini-bar { height:100%;background:#1976d2;border-radius:999px;transition:width .2s; }
    .ev-bar-total { height:6px;background:#f0f0f0;border-radius:999px;overflow:hidden;margin-bottom:.75rem; }
    .ev-bar-fill { height:100%;background:#1976d2;border-radius:999px;transition:width .3s; }
    .ev-bar-fill.over { background:#e63946; }
    .iv-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem; }
    @media(max-width:400px){ .iv-grid{grid-template-columns:repeat(2,1fr)} }
    .iv-cell { display:flex;flex-direction:column;gap:.3rem;align-items:center; }
    .iv-input { width:52px;text-align:center; }
    .edit-footer { display:flex;gap:.75rem;justify-content:flex-end;padding:1rem 1.5rem;border-top:1px solid #f0f0f0;flex-shrink:0;background:white; }

    /* ── Analyze button ──────────────────────────────────────────────────────── */
    .team-analyze-btn {
      display: flex; align-items: center; justify-content: center; gap: .4rem;
      width: 100%; margin-top: .85rem; padding: .6rem;
      background: linear-gradient(135deg, #1976d2, #1565c0);
      color: white; border: none; border-radius: 12px;
      font-size: .8rem; font-weight: 700; cursor: pointer;
      transition: all .2s;
      box-shadow: 0 3px 10px rgba(25,118,210,.28);
      letter-spacing: .1px;
    }
    .team-analyze-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 5px 16px rgba(25,118,210,.38);
      background: linear-gradient(135deg, #1e88e5, #1565c0);
    }
    .team-analyze-btn:disabled { opacity:.6; cursor:not-allowed; }

    /* ── Analysis modal ──────────────────────────────────────────────────────── */
    .analysis-modal {
      background:white; border-radius:20px; width:100%; max-width:700px;
      max-height:90vh; display:flex; flex-direction:column;
      box-shadow:0 24px 80px rgba(0,0,0,.3); overflow:hidden;
    }
    .an-header {
      display:flex; justify-content:space-between; align-items:center;
      padding:1.25rem 1.5rem; background:#1a1a2e; flex-shrink:0;
    }
    .an-header-left { display:flex; align-items:center; gap:.75rem; color:white; }
    .an-label { font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:rgba(255,255,255,.45); }
    .an-team-name { font-size:1.05rem; font-weight:800; color:white; }
    .an-close { color:rgba(255,255,255,.5)!important; }
    .an-close:hover { color:white!important; }
    .an-loading { display:flex;align-items:center;justify-content:center;gap:.6rem;padding:3rem;color:#888;font-size:.9rem; }
    .an-body { overflow-y:auto; flex:1; padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:1.5rem; }
    .an-section { display:flex; flex-direction:column; gap:.6rem; }
    .an-stitle {
      font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
      color:#aaa; border-bottom:1px solid #f0f0f0; padding-bottom:.4rem;
    }

    /* Member types */
    .an-members-row { display:flex; flex-wrap:wrap; gap:.5rem; }
    .an-member { display:flex;flex-direction:column;gap:.25rem;background:#f8f9fb;border:1px solid #f0f0f0;border-radius:10px;padding:.5rem .65rem; }
    .an-mname { font-size:.68rem; font-weight:700; text-transform:capitalize; color:#555; }
    .an-mtypes { display:flex; gap:.2rem; flex-wrap:wrap; }
    .small-tp { font-size:.58rem!important; padding:.1rem .32rem!important; }

    /* Legend */
    .an-legend { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; font-size:.68rem; color:#888; }
    .an-legend .adot { flex-shrink:0; }

    /* Threat grid */
    .an-threats-grid { display:flex; flex-direction:column; gap:.35rem; }
    .an-threat-row {
      display:flex; align-items:center; gap:.65rem;
      padding:.35rem .65rem; border-radius:10px;
      background:#fafafa; border:1px solid #f0f0f0;
    }
    .an-threat-row.t-crit   { background:rgba(230,57,70,.06); border-color:rgba(230,57,70,.22); }
    .an-threat-row.t-notable { background:rgba(255,152,0,.05); border-color:rgba(255,152,0,.2); }
    .an-dots { display:flex; gap:.28rem; flex:1; align-items:center; }
    .adot { width:10px; height:10px; border-radius:50%; flex-shrink:0; display:inline-block; }
    .adot-quad { background:#7f0000; }
    .adot-weak { background:#e53935; }
    .adot-res  { background:#43a047; }
    .adot-imm  { background:#1976d2; }
    .adot-neu  { background:#e0e0e0; }
    .an-weak-badge { font-size:.7rem; font-weight:800; color:#e53935; min-width:22px; text-align:right; }
    .an-weak-badge.badge-crit { color:#b71c1c; }

    /* Types row */
    .an-types-row { display:flex; flex-wrap:wrap; gap:.3rem; }

    /* Coverage */
    .an-cov-block { display:flex; flex-direction:column; gap:.55rem; }
    .an-cov-row { display:flex; align-items:flex-start; gap:.6rem; }
    .an-cov-lbl {
      font-size:.62rem; font-weight:700; background:#f0f0f0; color:#666;
      padding:.2rem .55rem; border-radius:999px; white-space:nowrap; flex-shrink:0; margin-top:.1rem;
    }
    .an-empty { font-size:.82rem; color:#bbb; }

    /* Tips */
    .an-tips { display:flex; flex-direction:column; gap:.45rem; }
    .an-tip {
      font-size:.82rem; color:#444; line-height:1.55;
      background:#f8f9fb; border:1px solid #eee;
      border-radius:10px; padding:.6rem .85rem;
    }
  `]
})
export class TeamsComponent implements OnInit {
  teamsService   = inject(TeamsService);
  pokemonService = inject(PokemonService);
  auth           = inject(AuthService);

  showBuildPaywall = signal(false);

  // ── Analysis ─────────────────────────────────────────────────────────────────
  analysisTeamId = signal<number|null>(null);
  teamAnalysis   = signal<TeamAnalysis|null>(null);
  analyzingTeam  = signal(false);

  readonly Math      = Math;
  readonly natures   = NATURES;
  readonly statKeys  = STAT_KEYS;
  readonly ivKeys    = IV_KEYS;
  slots = [1,2,3,4,5,6];

  showCreateModal      = signal(false);
  newTeamName          = '';
  confirmDeleteTeamId  = signal<number|null>(null);

  // ── Import ────────────────────────────────────────────────────────────────────
  showImportModal = signal(false);
  importPreview   = signal<{ name: string; members: any[] } | null>(null);
  importError     = signal('');
  importing       = signal(false);
  dragOver        = signal(false);
  showPicker           = signal(false);
  activeTeam           = signal<PokemonTeam|null>(null);
  activeSlot           = signal(0);
  pickerQuery          = '';
  pickerResults        = signal<PickerResult[]>([]);
  pickerLoading        = signal(false);
  addingMember         = signal(false);
  private search$      = new Subject<string>();

  editForm             = signal<EditForm|null>(null);
  editLoading          = signal(false);
  saving               = signal(false);
  showItemDropdown     = signal(false);
  activeMoveSlot       = signal(-1);
  moveQueries          = signal<string[]>(['','','','']);
  pokemonStats         = signal<Array<{base_stat:number;stat:{name:string}}>|null>(null);

  // ── Computed ─────────────────────────────────────────────────────────────────

  suggestedMoves = computed<string[]>(() => {
    const ef = this.editForm();
    const stats = this.pokemonStats();
    if (!ef || !stats || ef.types.length === 0) return [];
    return getRecommendedMoves(ef.types, stats, ef.ability, ef.heldItem,
      { evAtk:ef.evAtk, evSpAtk:ef.evSpAtk, evHp:ef.evHp, evDef:ef.evDef, evSpDef:ef.evSpDef, evSpeed:ef.evSpeed },
      ef.learnableMoves);
  });

  filteredRecommended = computed<ItemEntry[]>(() => {
    const ef = this.editForm();
    if (!ef || !this.showItemDropdown()) return [];
    const q = ef.heldItem.toLowerCase().trim();
    const recs = ef.suggestedItems;
    return ITEMS
      .filter(i => recs.includes(i.name))
      .filter(i => !q || i.display.toLowerCase().includes(q) || i.name.replace(/-/g,' ').includes(q))
      .sort((a,b) => recs.indexOf(a.name) - recs.indexOf(b.name));
  });

  filteredOther = computed<ItemEntry[]>(() => {
    const ef = this.editForm();
    if (!ef || !this.showItemDropdown()) return [];
    const q = ef.heldItem.toLowerCase().trim();
    if (q.length < 2) return [];
    const recs = ef.suggestedItems;
    return ITEMS
      .filter(i => !recs.includes(i.name))
      .filter(i => i.display.toLowerCase().includes(q) || i.name.replace(/-/g,' ').includes(q))
      .slice(0,14);
  });

  filteredRecommendedMoves = computed<MoveEntry[]>(() => {
    const slot = this.activeMoveSlot();
    if (slot < 0) return [];
    const ef = this.editForm();
    if (!ef) return [];
    const q = this.moveQueries()[slot].toLowerCase().trim();
    const recs = this.suggestedMoves();
    const others = new Set(ef.moves.filter((m,i) => m && i !== slot));
    return MOVE_DATA
      .filter(m => recs.includes(m.name) && !others.has(m.name))
      .filter(m => !q || m.name.replace(/-/g,' ').includes(q))
      .sort((a,b) => recs.indexOf(a.name) - recs.indexOf(b.name))
      .slice(0,12);
  });

  filteredOtherMoves = computed<string[]>(() => {
    const slot = this.activeMoveSlot();
    if (slot < 0) return [];
    const ef = this.editForm();
    if (!ef) return [];
    const q = this.moveQueries()[slot].toLowerCase().trim();
    if (q.length < 2) return [];
    const recs = this.suggestedMoves();
    const others = new Set(ef.moves.filter((m,i) => m && i !== slot));
    return ef.learnableMoves
      .filter(n => !recs.includes(n) && !others.has(n))
      .filter(n => n.replace(/-/g,' ').includes(q))
      .slice(0,15);
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnInit() {
    this.teamsService.load().subscribe();
    this.search$.pipe(
      debounceTime(350), distinctUntilChanged(),
      switchMap(q => {
        if (!q.trim()) { this.pickerLoading.set(false); return of(null); }
        this.pickerLoading.set(true);
        return this.pokemonService.getDetail(q.toLowerCase().trim()).pipe(catchError(() => of(null)));
      })
    ).subscribe(detail => {
      this.pickerLoading.set(false);
      if (detail) this.pickerResults.set([{ id:detail.id, name:detail.name,
        imageUrl: detail.sprites?.other?.['official-artwork']?.front_default ?? this.pokemonService.getPokemonImageUrl(detail.id) }]);
      else this.pickerResults.set([]);
    });
  }

  // ── Teams ─────────────────────────────────────────────────────────────────────

  getMember(team: PokemonTeam, slot: number) { return team.members.find(m => m.slot === slot) ?? null; }
  memberMoves(m: TeamMember): string[] { return [m.move1,m.move2,m.move3,m.move4].filter(Boolean) as string[]; }
  openCreateModal() { this.newTeamName = ''; this.showCreateModal.set(true); }
  createTeam() {
    if (!this.newTeamName.trim()) return;
    this.teamsService.create(this.newTeamName.trim()).subscribe();
    this.newTeamName = ''; this.showCreateModal.set(false);
  }
  doDeleteTeam() {
    const id = this.confirmDeleteTeamId(); if (id===null) return;
    this.teamsService.deleteTeam(id).subscribe(); this.confirmDeleteTeamId.set(null);
  }
  removeMember(teamId: number, pokemonId: number) { this.teamsService.removeMember(teamId, pokemonId).subscribe(); }

  // ── Picker ────────────────────────────────────────────────────────────────────

  openPicker(team: PokemonTeam, slot: number) {
    if (team.members.length >= 6) return;
    this.activeTeam.set(team); this.activeSlot.set(slot);
    this.pickerQuery = ''; this.pickerResults.set([]); this.pickerLoading.set(false); this.showPicker.set(true);
  }
  closePicker() { this.showPicker.set(false); this.activeTeam.set(null); }
  onPickerSearch(query: string) {
    if (!query.trim()) { this.pickerResults.set([]); this.pickerLoading.set(false); return; }
    this.search$.next(query);
  }
  isInTeam(pokemonId: number) { return this.activeTeam()?.members.some(m => m.pokemonId === pokemonId) ?? false; }
  selectPokemon(p: PickerResult) {
    if (this.isInTeam(p.id)) return;
    const team = this.activeTeam()!;
    this.addingMember.set(true);
    this.teamsService.addMember(team.id, p.id, p.name, p.imageUrl, this.activeSlot()).subscribe({
      next: () => { this.addingMember.set(false); this.closePicker(); },
      error: () => this.addingMember.set(false),
    });
  }

  // ── Edit build ────────────────────────────────────────────────────────────────

  openEdit(teamId: number, member: TeamMember) {
    if (!this.auth.isPremium()) { this.showBuildPaywall.set(true); return; }
    this.editLoading.set(true);
    this.moveQueries.set(['','','','']); this.showItemDropdown.set(false); this.activeMoveSlot.set(-1);
    this.pokemonStats.set(null);
    this.editForm.set({
      memberId:member.id, teamId,
      pokemonId:member.pokemonId, pokemonName:member.pokemonName,
      artworkUrl:member.pokemonImageUrl, types:[], availableAbilities:[], learnableMoves:[], suggestedItems:[],
      ability:member.ability??'', nature:member.nature??'', heldItem:member.heldItem??'',
      moves:[member.move1??'', member.move2??'', member.move3??'', member.move4??''],
      evHp:member.evHp??0, evAtk:member.evAtk??0, evDef:member.evDef??0,
      evSpAtk:member.evSpAtk??0, evSpDef:member.evSpDef??0, evSpeed:member.evSpeed??0,
      ivHp:member.ivHp??31, ivAtk:member.ivAtk??31, ivDef:member.ivDef??31,
      ivSpAtk:member.ivSpAtk??31, ivSpDef:member.ivSpDef??31, ivSpeed:member.ivSpeed??31,
    });
    this.pokemonService.getDetail(member.pokemonId).subscribe(detail => {
      const types = detail.types.map(t => t.type.name);
      const artwork = detail.sprites.other?.['official-artwork']?.front_default ?? this.pokemonService.getPokemonImageUrl(detail.id);
      const availableAbilities = detail.abilities.map(a => ({
        name:a.ability.name,
        nameEs:a.ability.name.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
        isHidden:a.is_hidden,
      }));
      const learnableMoves = [...new Set(detail.moves.map(m => m.move.name))].sort();
      const suggestedItems = getRecommendedItems(types, detail.stats);
      this.pokemonStats.set(detail.stats);
      this.editForm.update(f => f ? { ...f, types, artworkUrl:artwork, availableAbilities, learnableMoves, suggestedItems } : f);
      this.editLoading.set(false);
    });
  }

  closeEdit() { this.editForm.set(null); this.saving.set(false); this.showItemDropdown.set(false); this.activeMoveSlot.set(-1); }
  setField(key: string, value: string) { this.editForm.update(f => f ? { ...f, [key]:value } : f); }

  // Item
  onItemInput(value: string) { this.setField('heldItem', value); this.showItemDropdown.set(true); }
  onItemBlur() { setTimeout(() => this.showItemDropdown.set(false), 200); }
  selectItem(item: ItemEntry) { this.setField('heldItem', item.display); this.showItemDropdown.set(false); }
  clearItem() { this.setField('heldItem', ''); this.showItemDropdown.set(false); }

  // Moves
  onMoveFocus(slot: number) {
    const qs = [...this.moveQueries()];
    qs[slot] = this.editForm()?.moves[slot] ?? '';
    this.moveQueries.set(qs);
    this.activeMoveSlot.set(slot);
  }
  onMoveInput(slot: number, value: string) {
    const qs = [...this.moveQueries()]; qs[slot] = value; this.moveQueries.set(qs);
    this.editForm.update(f => { if (!f) return f; const moves=[...f.moves] as [string,string,string,string]; moves[slot]=value; return {...f,moves}; });
    this.activeMoveSlot.set(slot);
  }
  onMoveBlur() { setTimeout(() => this.activeMoveSlot.set(-1), 200); }
  setMove(slot: number, value: string) {
    const qs = [...this.moveQueries()]; qs[slot] = value; this.moveQueries.set(qs);
    this.editForm.update(f => { if (!f) return f; const moves=[...f.moves] as [string,string,string,string]; moves[slot]=value; return {...f,moves}; });
  }
  setMoveFromSuggestion(name: string) {
    const slot = this.activeMoveSlot(); if (slot < 0) return;
    this.setMove(slot, name); this.activeMoveSlot.set(-1);
  }
  isMoveUsedElsewhere(name: string): boolean {
    const slot = this.activeMoveSlot(); const ef = this.editForm();
    if (!ef || slot < 0) return false;
    return ef.moves.some((m,i) => m === name && i !== slot);
  }
  getMoveEntry(name: string): MoveEntry | null { return MOVE_DATA.find(m => m.name === name) ?? null; }

  // EVs / IVs
  evTotal = computed(() => { const f=this.editForm(); if(!f)return 0; return f.evHp+f.evAtk+f.evDef+f.evSpAtk+f.evSpDef+f.evSpeed; });
  getEv(key: string): number { return (this.editForm() as any)?.[key]??0; }
  setEv(key: string, value: number) { const v=Math.max(0,Math.min(252,Number(value)||0)); this.editForm.update(f=>f?{...f,[key]:v}:f); }
  getIv(key: string): number { return (this.editForm() as any)?.[key]??31; }
  setIv(key: string, value: number) { const v=Math.max(0,Math.min(31,Number(value)||0)); this.editForm.update(f=>f?{...f,[key]:v}:f); }

  saveEdit() {
    const f = this.editForm(); if (!f) return;
    this.saving.set(true);
    this.teamsService.updateMember(f.teamId, f.memberId, {
      heldItem:f.heldItem||null, ability:f.ability||null, nature:f.nature||null,
      move1:f.moves[0]||null, move2:f.moves[1]||null, move3:f.moves[2]||null, move4:f.moves[3]||null,
      evHp:f.evHp, evAtk:f.evAtk, evDef:f.evDef, evSpAtk:f.evSpAtk, evSpDef:f.evSpDef, evSpeed:f.evSpeed,
      ivHp:f.ivHp, ivAtk:f.ivAtk, ivDef:f.ivDef, ivSpAtk:f.ivSpAtk, ivSpDef:f.ivSpDef, ivSpeed:f.ivSpeed,
    }).subscribe({ next:()=>{ this.saving.set(false); this.closeEdit(); }, error:()=>this.saving.set(false) });
  }

  // ── Team Analysis ─────────────────────────────────────────────────────────────

  analyzeTeam(team: PokemonTeam) {
    if (!this.auth.isPremium()) { this.showBuildPaywall.set(true); return; }
    if (team.members.length === 0) return;
    this.analysisTeamId.set(team.id);
    this.teamAnalysis.set(null);
    this.analyzingTeam.set(true);

    forkJoin(team.members.map(m =>
      this.pokemonService.getDetail(m.pokemonId).pipe(catchError(() => of(null)))
    )).subscribe((details: any[]) => {
      const memberTypes: MemberTypeInfo[] = details.map((d, i) => ({
        name: team.members[i].pokemonName,
        types: d ? (d.types as any[]).map((t: any) => t.type.name as string) : [],
      }));
      const n = memberTypes.filter(m => m.types.length > 0).length || 1;

      const allStats: DefStat[] = (ALL_TYPES as readonly string[]).map(atk => {
        let weak = 0, quad = 0, resist = 0, immune = 0, neutral = 0;
        for (const mt of memberTypes) {
          if (!mt.types.length) continue;
          const e = getDefEff(atk, mt.types);
          if      (e === 0) immune++;
          else if (e >= 4)  { weak++; quad++; }
          else if (e >= 2)  weak++;
          else if (e <= .5) resist++;
          else              neutral++;
        }
        return { type: atk, weak, quad, resist, immune, neutral };
      });

      const threats    = allStats.filter(d => d.weak >= 1).sort((a,b) => b.weak - a.weak || b.quad - a.quad);
      const goodResists = allStats.filter(d => d.resist + d.immune >= 2).sort((a,b) => (b.resist+b.immune)-(a.resist+a.immune));

      const stabSet = new Set<string>(memberTypes.flatMap(m => m.types));
      const moveCovSet = new Set<string>();
      for (const m of team.members) {
        for (const mv of [m.move1,m.move2,m.move3,m.move4].filter(Boolean) as string[]) {
          const md = MOVE_DATA.find(e => e.name === mv);
          if (md && md.power > 0) moveCovSet.add(md.type);
        }
      }

      const allCov = new Set([...stabSet, ...moveCovSet]);
      const teamCanHit = (dt: string) =>
        (ALL_TYPES as readonly string[]).some(at => allCov.has(at) && (TYPE_EFF[at]?.[dt] ?? 1) >= 2);
      const uncovered = (ALL_TYPES as readonly string[]).filter(dt => !teamCanHit(dt));

      const tips: string[] = [];
      for (const d of threats.filter(t => t.weak >= 3)) {
        tips.push(`⚠️ Debilidad crítica al tipo ${TYPE_NAMES_ES[d.type]}: ${d.weak}/${n} miembros son débiles${d.quad > 0 ? `, uno con ×4` : ''}. Incluye un Pokémon que resista este tipo.`);
      }
      for (const d of threats.filter(t => t.weak === 2).slice(0, 3)) {
        tips.push(`💡 Tipo ${TYPE_NAMES_ES[d.type]}: 2 miembros son débiles${d.quad > 0 ? ' (uno ×4)' : ''}. El rival puede explotarlo.`);
      }
      if (uncovered.length > 0 && uncovered.length <= 7) {
        tips.push(`🎯 Sin cobertura ofensiva efectiva contra: ${uncovered.map(t => TYPE_NAMES_ES[t]).join(', ')}.`);
      }

      if (team.members.length >= 3) {
        const hasMove = (flag: string) => team.members.some(m =>
          [m.move1,m.move2,m.move3,m.move4].filter(Boolean)
            .some(mv => MOVE_DATA.find(e => e.name === mv && e.flags?.includes(flag))));
        if (!hasMove('hazard'))        tips.push('🪨 Sin trampas de entrada (Stealth Rock, Spikes). Esenciales para acumular daño pasivo.');
        if (!hasMove('hazard-remove')) tips.push('🧹 Sin eliminación de trampas (Rapid Spin / Defog). Las trampas enemigas debilitan a todo el equipo.');
        if (!hasMove('priority'))      tips.push('⚡ Sin movimientos de prioridad. Útiles para rematar rivales con poca vida.');
        if (!hasMove('setup'))         tips.push('📈 Sin movimientos de preparación (Danza Espada, Danza Dragón...). Un sweeper con setup puede ser decisivo.');
        if (!hasMove('pivot'))         tips.push('🔄 Sin pivotes (U-Turn, Volt Switch). Permiten hacer cambios seguros sin ceder el turno.');
        if (!hasMove('recovery'))      tips.push('💊 Sin recuperación propia. En combates largos, un Pokémon que se cure puede marcar la diferencia.');
      }

      if (tips.length === 0) tips.push('✅ ¡El equipo está bien equilibrado! No se detectaron problemas graves.');

      this.teamAnalysis.set({ memberTypes, threats, goodResists,
        stabCoverage: [...stabSet], moveCoverage: [...moveCovSet], tips });
      this.analyzingTeam.set(false);
    });
  }

  closeAnalysis() { this.analysisTeamId.set(null); this.teamAnalysis.set(null); }

  getAnalysisTeamName(): string {
    const id = this.analysisTeamId();
    return id === null ? '' : (this.teamsService.teams().find(t => t.id === id)?.name ?? '');
  }

  typeNameEs(t: string): string { return TYPE_NAMES_ES[t] ?? t; }
  arrayOf(n: number): number[] { return Array.from({ length: Math.max(0, n) }, (_, i) => i); }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  statLabel(key: string) { return STAT_LABELS[key]??key; }
  natureEs(name: string) { return NATURES.find(n=>n.name===name)?.es??name; }
  statShort(stat: string): string {
    const m: Record<string,string> = { attack:'Atq', defense:'Def', speed:'Vel', 'special-attack':'AtqE', 'special-defense':'DefE' };
    return m[stat]??stat;
  }
  formatName(name: string) { return name.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }
  movesDisplay(m1:string|null|undefined,m2:string|null|undefined,m3:string|null|undefined,m4:string|null|undefined){
    return [m1,m2,m3,m4].filter(x=>!!x).map(x=>this.formatName(x!)).join(' · ');
  }
  catLabel(cat: string) { return CAT_LABELS[cat]??cat; }
  catColor(cat: string) { return CAT_COLORS[cat]??'#888'; }
  moveCatLabel(cat: string) { return { physical:'Fís', special:'Esp', status:'Est' }[cat]??cat; }
  moveCatColor(cat: string) { return { physical:'#e53935', special:'#1976d2', status:'#757575' }[cat]??'#888'; }
  typeColor(type: string): string {
    const c: Record<string,string> = {
      normal:'#A8A878',fire:'#F08030',water:'#6890F0',electric:'#F8D030',grass:'#78C850',
      ice:'#98D8D8',fighting:'#C03028',poison:'#A040A0',ground:'#E0C068',flying:'#A890F0',
      psychic:'#F85888',bug:'#A8B820',rock:'#B8A038',ghost:'#705898',dragon:'#7038F8',
      dark:'#705848',steel:'#B8B8D0',fairy:'#EE99AC',
    };
    return c[type]??'#888';
  }

  onImgError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }

  // ── Export ────────────────────────────────────────────────────────────────────
  exportTeam(team: PokemonTeam) {
    const payload = {
      version: '1',
      name: team.name,
      exportedAt: new Date().toISOString(),
      members: team.members.map(m => ({
        slot: m.slot,
        pokemonId: m.pokemonId,
        pokemonName: m.pokemonName,
        pokemonImageUrl: m.pokemonImageUrl,
        heldItem: m.heldItem ?? null,
        ability:  m.ability  ?? null,
        nature:   m.nature   ?? null,
        move1: m.move1 ?? null, move2: m.move2 ?? null,
        move3: m.move3 ?? null, move4: m.move4 ?? null,
        evHp: m.evHp??0, evAtk: m.evAtk??0, evDef: m.evDef??0,
        evSpAtk: m.evSpAtk??0, evSpDef: m.evSpDef??0, evSpeed: m.evSpeed??0,
        ivHp: m.ivHp??31, ivAtk: m.ivAtk??31, ivDef: m.ivDef??31,
        ivSpAtk: m.ivSpAtk??31, ivSpDef: m.ivSpDef??31, ivSpeed: m.ivSpeed??31,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `equipo-${team.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Import ────────────────────────────────────────────────────────────────────
  openImportModal() {
    this.importPreview.set(null);
    this.importError.set('');
    this.importing.set(false);
    this.showImportModal.set(true);
  }

  closeImportModal() {
    this.showImportModal.set(false);
    this.importPreview.set(null);
    this.importError.set('');
  }

  onFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.parseImportFile(file);
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.parseImportFile(file);
  }

  private parseImportFile(file: File) {
    this.importError.set('');
    if (!file.name.endsWith('.json')) {
      this.importError.set('El archivo debe ser un .json exportado desde PokeNexo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target!.result as string);
        if (!data.name || !Array.isArray(data.members) || data.members.length === 0) {
          this.importError.set('Archivo inválido: no contiene un equipo válido.');
          return;
        }
        if (data.members.length > 6) {
          this.importError.set('El equipo tiene más de 6 Pokémon.');
          return;
        }
        const members = data.members.map((m: any) => ({
          slot:           m.slot           ?? 1,
          pokemonId:      m.pokemonId      ?? 0,
          pokemonName:    m.pokemonName    ?? '',
          pokemonImageUrl:m.pokemonImageUrl?? '',
          heldItem: m.heldItem ?? null, ability: m.ability ?? null, nature: m.nature ?? null,
          move1: m.move1??null, move2: m.move2??null, move3: m.move3??null, move4: m.move4??null,
          evHp: m.evHp??0, evAtk: m.evAtk??0, evDef: m.evDef??0,
          evSpAtk: m.evSpAtk??0, evSpDef: m.evSpDef??0, evSpeed: m.evSpeed??0,
          ivHp: m.ivHp??31, ivAtk: m.ivAtk??31, ivDef: m.ivDef??31,
          ivSpAtk: m.ivSpAtk??31, ivSpDef: m.ivSpDef??31, ivSpeed: m.ivSpeed??31,
        }));
        this.importPreview.set({ name: data.name, members });
      } catch {
        this.importError.set('No se pudo leer el archivo. ¿Está corrupto?');
      }
    };
    reader.readAsText(file);
  }

  confirmImport() {
    const prev = this.importPreview();
    if (!prev) return;
    this.importing.set(true);
    this.teamsService.importTeam({ name: prev.name, members: prev.members }).subscribe({
      next: () => {
        this.importing.set(false);
        this.closeImportModal();
      },
      error: () => {
        this.importing.set(false);
        this.importError.set('Error al importar el equipo. Intenta de nuevo.');
      },
    });
  }
}
