import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TopbarComponent } from '../../shared/components/topbar.component';

interface ItemSummary { id: number; name: string; sprite: string; }
interface GameEntry   { label: string; text: string; }
interface HeldBy      { name: string; rarity: string; }

interface GameEntry   { label: string; text: string; hasEs: boolean; } // hasEs = has Spanish text

interface ItemDetail {
  id: number; name: string; sprite: string;
  cost: number; category: string;
  esDesc: string;        // Spanish flavor text (most recent game with Spanish)
  enEffect: string;      // English technical effect (fallback only)
  gameEntries: GameEntry[];
  heldByPokemon: HeldBy[];
}

const PAGE_SIZE = 60;

const CAT_ES: Record<string, string> = {
  'standard-balls':'Pokéballs','special-balls':'Pokéballs especiales','apricorn-balls':'Pokéballs Kurt',
  'medicine':'Medicina','revival':'Revivir','status-cures':'Curas de estado',
  'in-a-pinch':'Bayas pinch','picky-healing':'Bayas curación',
  'vitamins':'Vitaminas','effort-training':'Alas entrenamiento','training':'Entrenamiento',
  'evolution':'Evolución','held-items':'Equipables','choice':'Equipable elección',
  'plates':'Planchas','mega-stones':'Megapiedras','z-crystals':'Cristales Z',
  'jewels':'Joyas elementales','all-machines':'MTs/COs','machines':'MOs (HM)',
  'gameplay':'Objeto clave','plot-advancement':'Historia','collectibles':'Coleccionables',
  'spelunking':'Exploración','lure':'Señuelos','mulch':'Fertilizantes',
  'stat-boosts':'Objetos combate','bad-held-items':'Objetos trampa',
  'type-protection':'Bayas protección','baking-only':'Pasteles','effort-drop':'Bayas BE',
  'scarves':'Pañuelos','species-specific':'Especie específica',
  'type-enhancement':'Potenciadores de tipo','event-items':'Evento',
  'flutes':'Flautas','loot':'Botín',
};

const VERSION_GROUP_ES: Record<string, string> = {
  'red-blue':'Rojo / Azul','yellow':'Amarillo','gold-silver':'Oro / Plata','crystal':'Cristal',
  'ruby-sapphire':'Rubí / Zafiro','emerald':'Esmeralda','firered-leafgreen':'RojoFuego / VerdaHoja',
  'diamond-pearl':'Diamante / Perla','platinum':'Platino',
  'heartgold-soulsilver':'OroHeartGold / PlataSoulSilver',
  'black-white':'Negro / Blanco','black-2-white-2':'Negro 2 / Blanco 2',
  'x-y':'X / Y','omega-ruby-alpha-sapphire':'Rubí Omega / Zafiro Alfa',
  'sun-moon':'Sol / Luna','ultra-sun-ultra-moon':'Ultrasol / Ultraluna',
  'lets-go':'Lets Go Pikachu / Eevee','sword-shield':'Espada / Escudo',
  'brilliant-diamond-and-shining-pearl':'Diamante Brillante / Perla Reluciente',
  'legends-arceus':'Leyendas: Arceus','scarlet-violet':'Escarlata / Púrpura',
};

const VG_ORDER = [
  'red-blue','yellow','gold-silver','crystal','ruby-sapphire','emerald','firered-leafgreen',
  'diamond-pearl','platinum','heartgold-soulsilver','black-white','black-2-white-2',
  'x-y','omega-ruby-alpha-sapphire','sun-moon','ultra-sun-ultra-moon',
  'lets-go','sword-shield','brilliant-diamond-and-shining-pearl','legends-arceus','scarlet-violet',
];

const RARITY_ES: Record<string, string> = {
  'always':'Siempre','common':'Común','uncommon':'Poco común','rare':'Raro','never':'Nunca',
};

const TABS = [
  { key: 'all',            label: 'Todos' },
  { key: 'standard-balls', label: 'Pokéballs' },
  { key: 'medicine',       label: 'Medicina' },
  { key: 'vitamins',       label: 'Vitaminas' },
  { key: 'evolution',      label: 'Evolución' },
  { key: 'held-items',     label: 'Equipables' },
  { key: 'machines',       label: 'MTs/MOs' },
  { key: 'stat-boosts',    label: 'Combate' },
  { key: 'berries',        label: 'Bayas' },
];

function buildGameEntries(flavorTexts: any[]): GameEntry[] {
  // Build per-version-group map with Spanish preferred
  const byGroup = new Map<string, { text: string; hasEs: boolean }>();
  for (const f of flavorTexts) {
    if (f.language.name !== 'es' && f.language.name !== 'en') continue;
    const key = f.version_group?.name ?? '';
    if (!key) continue;
    const clean = (f.text as string).replace(/[\n\f­]/g, ' ').trim();
    const existing = byGroup.get(key);
    if (f.language.name === 'es') {
      byGroup.set(key, { text: clean, hasEs: true });
    } else if (!existing) {
      byGroup.set(key, { text: clean, hasEs: false });
    }
  }

  const ordered = VG_ORDER
    .filter(g => byGroup.has(g))
    .map(g => ({ label: VERSION_GROUP_ES[g] ?? g, ...byGroup.get(g)! }));

  // Merge consecutive entries with same text AND same hasEs flag
  const result: { groups: string[]; text: string; hasEs: boolean }[] = [];
  for (const e of ordered) {
    const last = result[result.length - 1];
    if (last && last.text === e.text && last.hasEs === e.hasEs) {
      last.groups.push(e.label);
    } else {
      result.push({ groups: [e.label], text: e.text, hasEs: e.hasEs });
    }
  }
  return result.map(r => ({ label: r.groups.join(' · '), text: r.text, hasEs: r.hasEs }));
}

function latestEsFlavorText(flavorTexts: any[]): string {
  // Walk in reverse (API returns oldest→newest) to get most-recent Spanish text
  for (let i = flavorTexts.length - 1; i >= 0; i--) {
    if (flavorTexts[i].language?.name === 'es') {
      return (flavorTexts[i].text as string).replace(/[\n\f­]/g, ' ').trim();
    }
  }
  return '';
}

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, TopbarComponent],
  template: `
    <app-topbar title="Objetos" />

    <div class="page">

      <!-- SEARCH + TABS -->
      <div class="controls">
        <div class="search-wrap">
          <svg class="s-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="s-input" type="text" placeholder="Buscar por nombre o #ID…"
                 [value]="searchQuery()"
                 (input)="onSearch($any($event.target).value)" />
          <button class="s-clear" *ngIf="searchQuery()" (click)="onSearch('')">✕</button>
        </div>

        <div class="cat-tabs">
          <button *ngFor="let t of tabs"
                  class="cat-btn" [class.active]="selectedCat() === t.key"
                  (click)="selectCat(t.key)">
            {{ t.label }}
          </button>
        </div>
      </div>

      <!-- INFO BAR -->
      <div class="info-bar" *ngIf="!loading()">
        <span class="count-text">{{ filteredItems().length }} objetos</span>
        <span class="loading-cat" *ngIf="loadingCat()">Cargando categoría…</span>
        <div class="pagination" *ngIf="totalPages() > 1">
          <button class="pag-btn" [disabled]="page() === 0" (click)="goPage(page() - 1)">‹</button>
          <span class="pag-info">{{ page() + 1 }} / {{ totalPages() }}</span>
          <button class="pag-btn" [disabled]="page() === totalPages() - 1" (click)="goPage(page() + 1)">›</button>
        </div>
      </div>

      <!-- LOADING SKELETON -->
      <div class="grid" *ngIf="loading()">
        <div class="skeleton-card" *ngFor="let _ of skeletons"></div>
      </div>

      <!-- ITEMS GRID -->
      <div class="grid" *ngIf="!loading()">
        <div class="item-card" *ngFor="let item of pagedItems()" (click)="openItem(item)">
          <span class="item-id">#{{ item.id }}</span>
          <div class="sprite-wrap">
            <img [src]="item.sprite" [alt]="item.name" class="item-sprite"
                 (error)="onImgError($event)" loading="lazy" />
            <svg class="sprite-fallback" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"
                 width="36" height="36">
              <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/>
              <path d="M12 3v18"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/>
            </svg>
          </div>
          <span class="item-name">{{ formatName(item.name) }}</span>
        </div>

        <div class="empty-state" *ngIf="pagedItems().length === 0 && !loadingCat()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>Sin resultados para "{{ searchQuery() }}"</p>
        </div>
      </div>

      <!-- BOTTOM PAGINATION -->
      <div class="pagination bottom-pag" *ngIf="!loading() && totalPages() > 1">
        <button class="pag-btn" [disabled]="page() === 0" (click)="goPage(page() - 1)">‹</button>
        <button *ngFor="let n of pageRange()" class="pag-num"
                [class.active]="n === page()" (click)="goPage(n)">{{ n + 1 }}</button>
        <button class="pag-btn" [disabled]="page() === totalPages() - 1" (click)="goPage(page() + 1)">›</button>
      </div>
    </div>

    <!-- DETAIL MODAL -->
    <div class="modal-overlay" *ngIf="selectedItem()" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">

        <!-- Loading -->
        <div class="modal-loading" *ngIf="loadingDetail()">
          <div class="pokeball-spin"></div>
          <p>Cargando…</p>
        </div>

        <ng-container *ngIf="!loadingDetail() && selectedItem() as item">

          <!-- HERO ROW -->
          <div class="modal-hero">
            <div class="hero-sprite-wrap">
              <img [src]="item.sprite" [alt]="item.name" class="modal-sprite"
                   (error)="onModalImgError($event)" />
              <svg class="modal-sprite-fallback" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.2"
                   width="64" height="64" style="display:none">
                <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/>
                <path d="M12 3v18"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/>
              </svg>
            </div>
            <div class="hero-info">
              <div class="modal-id">#{{ item.id }}</div>
              <h2 class="modal-name">{{ formatName(item.name) }}</h2>
              <div class="modal-tags">
                <span class="modal-cat" *ngIf="item.category">{{ catNameEs(item.category) }}</span>
                <span class="modal-cost" *ngIf="item.cost > 0">
                  <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    <text x="5" y="12" font-size="9" font-weight="bold">₽</text>
                  </svg>
                  {{ item.cost | number }} ₽
                </span>
                <span class="modal-free" *ngIf="item.cost === 0">No vendible</span>
              </div>
            </div>
            <button class="modal-x" (click)="closeModal()">✕</button>
          </div>

          <!-- SCROLLABLE BODY -->
          <div class="modal-scroll">

            <!-- EFFECT: Spanish flavor text (most recent game), English technical fallback -->
            <div class="ds" *ngIf="item.esDesc || item.enEffect">
              <div class="ds-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Efecto
              </div>
              <!-- Spanish description from most recent game -->
              <p class="ds-text" *ngIf="item.esDesc">{{ item.esDesc }}</p>
              <!-- English technical effect (only if no Spanish exists) -->
              <div *ngIf="!item.esDesc && item.enEffect">
                <p class="ds-text en-fallback">{{ item.enEffect }}</p>
                <span class="en-note">Descripción no disponible en español</span>
              </div>
            </div>

            <!-- HOW TO GET -->
            <div class="ds">
              <div class="ds-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Cómo obtenerlo
              </div>
              <div class="obtain-list">
                <div class="obtain-row" *ngIf="item.cost > 0">
                  <span class="ob-badge shop">Tienda</span>
                  <span class="ob-text">Disponible en Poké Mart y tiendas por <strong>{{ item.cost | number }} ₽</strong></span>
                </div>
                <div class="obtain-row" *ngFor="let p of item.heldByPokemon">
                  <span class="ob-badge wild">Salvaje</span>
                  <span class="ob-text">Portado por <strong>{{ formatName(p.name) }}</strong>
                    <em class="ob-rarity"> · {{ rarityEs(p.rarity) }}</em>
                  </span>
                </div>
                <div class="obtain-empty" *ngIf="item.cost === 0 && item.heldByPokemon.length === 0">
                  Objeto especial — no se vende ni lo portan Pokémon salvajes. Se obtiene por eventos, intercambio o progreso de la historia.
                </div>
              </div>
            </div>

            <!-- PER-GAME DESCRIPTIONS -->
            <div class="ds" *ngIf="item.gameEntries.length > 0">
              <div class="ds-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                Descripción en cada juego
              </div>
              <div class="game-list">
                <div class="game-row" *ngFor="let g of item.gameEntries" [class.en-row]="!g.hasEs">
                  <div class="game-label-wrap">
                    <div class="game-label">{{ g.label }}</div>
                    <span class="en-tag" *ngIf="!g.hasEs">EN</span>
                  </div>
                  <div class="game-text">"{{ g.text }}"</div>
                </div>
              </div>
            </div>

            <div class="ds-empty" *ngIf="!item.esDesc && !item.enEffect && item.gameEntries.length === 0">
              Sin descripción disponible para este objeto.
            </div>

          </div><!-- /modal-scroll -->
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; padding: 1.5rem; }

    /* CONTROLS */
    .controls { display: flex; flex-direction: column; gap: .75rem; margin-bottom: 1rem; }
    .search-wrap {
      position: relative; display: flex; align-items: center;
      background: white; border: 1.5px solid #e8e8e8; border-radius: 12px;
      padding: .55rem .75rem .55rem 2.4rem; box-shadow: 0 1px 4px rgba(0,0,0,.05);
    }
    .s-icon { position: absolute; left: .75rem; color: #bbb; pointer-events: none; }
    .s-input { flex: 1; border: none; outline: none; font-size: .9rem; color: #1a1a2e; background: transparent; }
    .s-input::placeholder { color: #ccc; }
    .s-clear { background: none; border: none; cursor: pointer; color: #ccc; font-size: .85rem;
               padding: 0 .25rem; transition: color .15s; }
    .s-clear:hover { color: #e63946; }

    .cat-tabs { display: flex; gap: .35rem; flex-wrap: nowrap; overflow-x: auto; padding-bottom: .15rem;
                scrollbar-width: none; }
    .cat-tabs::-webkit-scrollbar { display: none; }
    .cat-btn { flex-shrink: 0; padding: .35rem .85rem; border: 1.5px solid #e8e8e8;
               border-radius: 999px; background: none; font-size: .78rem; font-weight: 600;
               color: #888; cursor: pointer; transition: all .18s; white-space: nowrap; }
    .cat-btn:hover { border-color: #e63946; color: #e63946; background: rgba(230,57,70,.04); }
    .cat-btn.active { background: #e63946; border-color: #e63946; color: white; }

    /* INFO BAR */
    .info-bar { display: flex; align-items: center; gap: 1rem; margin-bottom: .75rem; }
    .count-text { font-size: .8rem; color: #aaa; font-weight: 500; }
    .loading-cat { font-size: .78rem; color: #e63946; }

    /* GRID */
    .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: .75rem; }
    @media (max-width: 900px) { .grid { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 560px) { .grid { grid-template-columns: repeat(3, 1fr); } }

    .item-card {
      position: relative; background: white; border-radius: 14px;
      padding: .75rem .5rem .65rem; display: flex; flex-direction: column; align-items: center;
      gap: .35rem; cursor: pointer; box-shadow: 0 1px 6px rgba(0,0,0,.07);
      transition: transform .18s, box-shadow .18s; border: 1.5px solid transparent;
    }
    .item-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,.11); border-color: #e8e8f0; }
    .item-id { position: absolute; top: .45rem; left: .5rem; font-size: .58rem; color: #ccc; font-weight: 700; }
    .sprite-wrap { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .item-sprite { width: 56px; height: 56px; object-fit: contain; image-rendering: pixelated; }
    .sprite-fallback { display: none; color: #d8d8e4; }
    .item-name { font-size: .65rem; font-weight: 600; color: #333; text-align: center;
                 line-height: 1.3; max-width: 100%; overflow-wrap: break-word; }

    .skeleton-card {
      border-radius: 14px; height: 108px;
      background: linear-gradient(90deg, #f0f0f5 25%, #e8e8ef 50%, #f0f0f5 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }

    .empty-state { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center;
                   gap: .75rem; padding: 3rem; color: #ccc; font-size: .9rem; text-align: center; }

    /* PAGINATION */
    .pagination { display: flex; align-items: center; gap: .35rem; margin-left: auto; }
    .bottom-pag { justify-content: center; margin-top: 1.5rem; }
    .pag-btn { background: white; border: 1.5px solid #e8e8e8; border-radius: 8px;
               width: 32px; height: 32px; font-size: 1rem; cursor: pointer; color: #555;
               display: flex; align-items: center; justify-content: center; transition: all .18s; }
    .pag-btn:hover:not(:disabled) { border-color: #e63946; color: #e63946; }
    .pag-btn:disabled { opacity: .35; cursor: not-allowed; }
    .pag-info { font-size: .78rem; font-weight: 600; color: #555; padding: 0 .25rem; }
    .pag-num { background: white; border: 1.5px solid #e8e8e8; border-radius: 8px;
               width: 32px; height: 32px; font-size: .78rem; font-weight: 600; cursor: pointer;
               color: #555; display: flex; align-items: center; justify-content: center; transition: all .18s; }
    .pag-num:hover { border-color: #e63946; color: #e63946; }
    .pag-num.active { background: #e63946; border-color: #e63946; color: white; }

    /* ─── MODAL ──────────────────────────────────────────── */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.55); backdrop-filter: blur(2px);
      display: flex; align-items: center; justify-content: center; z-index: 300; padding: 1rem;
    }
    .modal {
      background: white; border-radius: 22px; width: 100%; max-width: 640px;
      max-height: 88vh; overflow: hidden; display: flex; flex-direction: column;
      box-shadow: 0 24px 72px rgba(0,0,0,.35);
    }

    .modal-loading {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 3rem; gap: 1rem; color: #888;
    }
    .pokeball-spin { width: 36px; height: 36px; border-radius: 50%;
                     background: linear-gradient(180deg,#e63946 50%,white 50%);
                     border: 3px solid #1a1a2e; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Hero row */
    .modal-hero {
      display: flex; align-items: center; gap: 1rem;
      padding: 1.25rem 1.4rem; background: #f5f5f8;
      border-bottom: 1.5px solid #ececf2; flex-shrink: 0;
    }
    .hero-sprite-wrap {
      width: 88px; height: 88px; background: white; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 10px rgba(0,0,0,.08); flex-shrink: 0;
    }
    .modal-sprite { width: 72px; height: 72px; object-fit: contain; image-rendering: pixelated; }
    .hero-info { flex: 1; min-width: 0; }
    .modal-id { font-size: .72rem; color: #bbb; font-weight: 700; letter-spacing: .03em; }
    .modal-name { font-size: 1.35rem; font-weight: 800; color: #1a1a2e; margin: .1rem 0 .5rem; line-height: 1.2; }
    .modal-tags { display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; }
    .modal-cat { background: rgba(230,57,70,.1); color: #e63946; font-size: .7rem; font-weight: 700;
                 padding: .2rem .6rem; border-radius: 999px; }
    .modal-cost { display: flex; align-items: center; gap: .25rem; font-size: .72rem; font-weight: 700;
                  color: #f4a00a; background: rgba(244,160,10,.1); padding: .2rem .55rem; border-radius: 999px; }
    .modal-free { font-size: .7rem; color: #bbb; font-style: italic; }
    .modal-x {
      flex-shrink: 0; background: none; border: 1.5px solid #e0e0e8; border-radius: 50%;
      width: 30px; height: 30px; font-size: .85rem; cursor: pointer; color: #aaa;
      display: flex; align-items: center; justify-content: center; align-self: flex-start;
      transition: all .15s;
    }
    .modal-x:hover { border-color: #e63946; color: #e63946; }

    /* Scrollable body */
    .modal-scroll { flex: 1; overflow-y: auto; padding: 1.25rem 1.4rem 1.5rem; display: flex; flex-direction: column; gap: 1.1rem; }
    .modal-scroll::-webkit-scrollbar { width: 5px; }
    .modal-scroll::-webkit-scrollbar-thumb { background: #e0e0e8; border-radius: 99px; }

    /* Detail section */
    .ds { display: flex; flex-direction: column; gap: .55rem; }
    .ds-head {
      display: flex; align-items: center; gap: .4rem;
      font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
      color: #bbb;
    }
    .ds-text { font-size: .88rem; color: #333; line-height: 1.6; margin: 0; }
    .ds-empty { font-size: .82rem; color: #ccc; text-align: center; padding: 1rem 0; }

    /* Obtain section */
    .obtain-list { display: flex; flex-direction: column; gap: .5rem; }
    .obtain-row { display: flex; align-items: flex-start; gap: .6rem; }
    .ob-badge {
      flex-shrink: 0; font-size: .65rem; font-weight: 800; padding: .18rem .5rem;
      border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; margin-top: .05rem;
    }
    .ob-badge.shop { background: rgba(67,160,71,.12); color: #43a047; }
    .ob-badge.wild { background: rgba(30,136,229,.12); color: #1e88e5; }
    .ob-text { font-size: .86rem; color: #333; line-height: 1.5; }
    .ob-rarity { color: #888; }
    .obtain-empty { font-size: .84rem; color: #888; line-height: 1.55; font-style: italic; }

    /* English fallback */
    .en-fallback { color: #777 !important; }
    .en-note { font-size: .68rem; color: #bbb; font-style: italic; display: block; margin-top: .15rem; }

    /* Game entries */
    .game-list { display: flex; flex-direction: column; gap: 0; border: 1.5px solid #ececf2; border-radius: 14px; overflow: hidden; }
    .game-row { padding: .7rem .9rem; display: flex; flex-direction: column; gap: .25rem; border-bottom: 1px solid #f0f0f5; }
    .game-row:last-child { border-bottom: none; }
    .game-row.en-row { background: #fafafa; }
    .game-label-wrap { display: flex; align-items: center; gap: .4rem; }
    .game-label { font-size: .68rem; font-weight: 800; color: #e63946; text-transform: uppercase; letter-spacing: .05em; }
    .en-tag { font-size: .58rem; font-weight: 800; color: #aaa; border: 1px solid #ddd; border-radius: 4px; padding: .05rem .28rem; letter-spacing: .04em; }
    .game-text { font-size: .83rem; color: #444; line-height: 1.55; font-style: italic; }
    .game-row.en-row .game-text { color: #888; }

    /* ─── DARK MODE ─────────────────────────────────────── */
    :host-context(html.dark) .search-wrap { background: #12102a; border-color: rgba(255,255,255,.1); }
    :host-context(html.dark) .s-input { color: #e0e0f0; }
    :host-context(html.dark) .s-icon  { color: #3a3a50; }
    :host-context(html.dark) .s-clear { color: #3a3a50; }
    :host-context(html.dark) .cat-btn { border-color: rgba(255,255,255,.08); color: #555; }
    :host-context(html.dark) .cat-btn:hover { color: #e63946; }
    :host-context(html.dark) .cat-btn.active { background: #e63946; border-color: #e63946; color: white; }
    :host-context(html.dark) .count-text { color: #3a3a50; }
    :host-context(html.dark) .item-card { background: #1a1a2e; box-shadow: 0 2px 10px rgba(0,0,0,.35); }
    :host-context(html.dark) .item-card:hover { border-color: rgba(255,255,255,.1); }
    :host-context(html.dark) .item-id   { color: #2a2a3e; }
    :host-context(html.dark) .item-name { color: #d0d0e8; }
    :host-context(html.dark) .sprite-fallback { color: #2a2a3e; }
    :host-context(html.dark) .skeleton-card { background: linear-gradient(90deg,#1a1a2e 25%,#22223e 50%,#1a1a2e 75%); background-size: 200% 100%; }
    :host-context(html.dark) .pag-btn, :host-context(html.dark) .pag-num { background: #1a1a2e; border-color: rgba(255,255,255,.08); color: #888; }
    :host-context(html.dark) .pag-info { color: #555; }
    :host-context(html.dark) .modal { background: #1a1a2e; }
    :host-context(html.dark) .modal-hero { background: #12102a; border-bottom-color: rgba(255,255,255,.06); }
    :host-context(html.dark) .hero-sprite-wrap { background: #1a1a2e; }
    :host-context(html.dark) .modal-id   { color: #3a3a50; }
    :host-context(html.dark) .modal-name { color: #e8e8f8; }
    :host-context(html.dark) .modal-x   { border-color: rgba(255,255,255,.1); color: #555; }
    :host-context(html.dark) .modal-x:hover { border-color: #e63946; color: #e63946; }
    :host-context(html.dark) .modal-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.07); }
    :host-context(html.dark) .ds-head  { color: #3a3a50; }
    :host-context(html.dark) .ds-text  { color: #a0a0c0; }
    :host-context(html.dark) .ob-text  { color: #a0a0c0; }
    :host-context(html.dark) .ob-rarity { color: #555; }
    :host-context(html.dark) .obtain-empty { color: #555; }
    :host-context(html.dark) .en-note   { color: #3a3a50; }
    :host-context(html.dark) .en-tag    { color: #3a3a50; border-color: rgba(255,255,255,.08); }
    :host-context(html.dark) .game-list { border-color: rgba(255,255,255,.06); }
    :host-context(html.dark) .game-row  { border-bottom-color: rgba(255,255,255,.04); }
    :host-context(html.dark) .game-row.en-row { background: rgba(255,255,255,.02); }
    :host-context(html.dark) .game-text { color: #6a6a8a; }
    :host-context(html.dark) .game-row.en-row .game-text { color: #4a4a5a; }
    :host-context(html.dark) .ds-empty  { color: #3a3a50; }
    :host-context(html.dark) .modal-free { color: #3a3a50; }
  `]
})
export class ItemsComponent implements OnInit {
  private http    = inject(HttpClient);
  private pokeApi = 'https://pokeapi.co/api/v2';

  tabs        = TABS;
  skeletons   = Array(60);
  allItems    = signal<ItemSummary[]>([]);
  loading     = signal(true);
  searchQuery = signal('');
  selectedCat = signal('all');
  page        = signal(0);
  loadingCat  = signal(false);
  selectedItem  = signal<ItemDetail | null>(null);
  loadingDetail = signal(false);

  private catCache = new Map<string, Set<string>>();
  private catFilter = signal<Set<string> | null>(null);

  filteredItems = computed(() => {
    const q      = this.searchQuery().toLowerCase().trim();
    const catSet = this.catFilter();
    return this.allItems().filter(item => {
      if (catSet && !catSet.has(item.name)) return false;
      if (q && !item.name.includes(q) && !String(item.id).includes(q)) return false;
      return true;
    });
  });

  pagedItems  = computed(() => this.filteredItems().slice(this.page() * PAGE_SIZE, (this.page() + 1) * PAGE_SIZE));
  totalPages  = computed(() => Math.ceil(this.filteredItems().length / PAGE_SIZE));

  ngOnInit() {
    this.http.get<{ results: { name: string; url: string }[] }>(`${this.pokeApi}/item?limit=2000`).subscribe(res => {
      this.allItems.set(
        res.results
          .map(r => ({ id: this.extractId(r.url), name: r.name,
                       sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${r.name}.png` }))
          .sort((a, b) => a.id - b.id)
      );
      this.loading.set(false);
    });
  }

  onSearch(q: string) { this.searchQuery.set(q); this.page.set(0); }

  selectCat(key: string) {
    this.selectedCat.set(key);
    this.page.set(0);
    if (key === 'all') { this.catFilter.set(null); return; }

    if (key === 'machines') {
      this.catFilter.set(new Set(this.allItems()
        .filter(i => /^(tm|hm)\d+$/.test(i.name) || i.name.startsWith('technical-machine') || i.name.startsWith('hidden-machine'))
        .map(i => i.name)));
      return;
    }
    if (key === 'berries') {
      this.catFilter.set(new Set(this.allItems().filter(i => i.name.endsWith('-berry')).map(i => i.name)));
      return;
    }

    if (this.catCache.has(key)) { this.catFilter.set(this.catCache.get(key)!); return; }

    this.loadingCat.set(true);
    this.http.get<{ items: { name: string }[] }>(`${this.pokeApi}/item-category/${key}`).subscribe({
      next: res => {
        const set = new Set(res.items.map(i => i.name));
        this.catCache.set(key, set);
        this.catFilter.set(set);
        this.loadingCat.set(false);
      },
      error: () => { this.catFilter.set(new Set()); this.loadingCat.set(false); }
    });
  }

  openItem(item: ItemSummary) {
    this.selectedItem.set({
      id: item.id, name: item.name, sprite: item.sprite,
      cost: 0, category: '', esDesc: '', enEffect: '',
      gameEntries: [], heldByPokemon: [],
    });
    this.loadingDetail.set(true);

    this.http.get<any>(`${this.pokeApi}/item/${item.id}`).subscribe(d => {
      const flavorTexts = d.flavor_text_entries ?? [];
      const esDesc  = latestEsFlavorText(flavorTexts);
      const enEffect = d.effect_entries?.find((e: any) => e.language.name === 'en')?.effect
                    ?? d.effect_entries?.find((e: any) => e.language.name === 'en')?.short_effect ?? '';

      const heldByPokemon: HeldBy[] = (d.held_by_pokemon ?? []).map((h: any) => ({
        name: h.pokemon?.name ?? '',
        rarity: h.version_details?.[h.version_details.length - 1]?.rarity ?? 0,
      })).filter((h: HeldBy) => h.name);

      const gameEntries = buildGameEntries(flavorTexts);

      this.selectedItem.set({
        id: d.id, name: d.name,
        sprite: d.sprites?.default ?? item.sprite,
        cost: d.cost ?? 0,
        category: d.category?.name ?? '',
        esDesc, enEffect,
        gameEntries, heldByPokemon,
      });
      this.loadingDetail.set(false);
    });
  }

  closeModal()  { this.selectedItem.set(null); }
  goPage(n: number) { this.page.set(n); scrollTo({ top: 0, behavior: 'smooth' }); }

  pageRange(): number[] {
    const total = this.totalPages();
    const cur   = this.page();
    const delta = 2;
    const start = Math.max(0, cur - delta);
    const end   = Math.min(total - 1, cur + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  formatName(name: string): string {
    return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  catNameEs(cat: string): string {
    return CAT_ES[cat] ?? cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  rarityEs(rarity: string | number): string {
    if (typeof rarity === 'number') {
      if (rarity === 100) return 'Siempre';
      if (rarity >= 50)  return 'Común';
      if (rarity >= 20)  return 'Poco común';
      return 'Raro';
    }
    return RARITY_ES[rarity] ?? rarity;
  }

  onImgError(e: Event) {
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
    const fallback = img.nextElementSibling as HTMLElement | null;
    if (fallback) fallback.style.display = 'block';
  }

  onModalImgError(e: Event) {
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
    const fallback = img.nextElementSibling as HTMLElement | null;
    if (fallback) fallback.style.display = 'block';
  }

  private extractId(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return parseInt(parts[parts.length - 1], 10);
  }
}
