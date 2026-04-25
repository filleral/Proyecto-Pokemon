import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

interface PokemonEntry { id: number; name: string; }

const GAME_META: Record<string, { label: string; bg: string; logo: string }> = {
  'red':              { label: 'Rojo',             bg: '#5a0000', logo: 'game-logos/red.png' },
  'blue':             { label: 'Azul',             bg: '#00008B', logo: 'game-logos/blue.png' },
  'yellow':           { label: 'Amarillo',         bg: '#7a5a00', logo: 'game-logos/yellow.png' },
  'gold':             { label: 'Oro',              bg: '#5a3a00', logo: 'game-logos/gold.png' },
  'silver':           { label: 'Plata',            bg: '#3a3a3a', logo: 'game-logos/silver.png' },
  'crystal':          { label: 'Cristal',          bg: '#083050', logo: 'game-logos/crystal.png' },
  'ruby':             { label: 'Rubí',             bg: '#5a000c', logo: 'game-logos/ruby.png' },
  'sapphire':         { label: 'Zafiro',           bg: '#001a6e', logo: 'game-logos/sapphire.png' },
  'emerald':          { label: 'Esmeralda',        bg: '#00391a', logo: 'game-logos/emerald.png' },
  'firered':          { label: 'Rojo Fuego',       bg: '#6b1800', logo: 'game-logos/firered.png' },
  'leafgreen':        { label: 'Verde Hoja',       bg: '#113300', logo: 'game-logos/leafgreen.png' },
  'diamond':          { label: 'Diamante',         bg: '#0d2b52', logo: 'game-logos/diamond.png' },
  'pearl':            { label: 'Perla',            bg: '#5c1530', logo: 'game-logos/pearl.png' },
  'platinum':         { label: 'Platino',          bg: '#1e1e28', logo: 'game-logos/platinum.png' },
  'heartgold':        { label: 'HeartGold',        bg: '#4a2a00', logo: 'game-logos/heartgold.png' },
  'soulsilver':       { label: 'SoulSilver',       bg: '#1e1e3e', logo: 'game-logos/soulsilver.png' },
  'black':            { label: 'Negro',            bg: '#0a0a0a', logo: 'game-logos/black.png' },
  'white':            { label: 'Blanco',           bg: '#2a2a36', logo: 'game-logos/white.png' },
  'black-2':          { label: 'Negro 2',          bg: '#12121e', logo: 'game-logos/black-2.png' },
  'white-2':          { label: 'Blanco 2',         bg: '#222230', logo: 'game-logos/white-2.png' },
  'x':                { label: 'X',                bg: '#011e38', logo: 'game-logos/x.png' },
  'y':                { label: 'Y',                bg: '#420000', logo: 'game-logos/y.png' },
  'omega-ruby':       { label: 'Omega Rubí',       bg: '#420008', logo: 'game-logos/omega-ruby.png' },
  'alpha-sapphire':   { label: 'Alfa Zafiro',      bg: '#000e48', logo: 'game-logos/alpha-sapphire.png' },
  'sun':              { label: 'Sol',              bg: '#422000', logo: 'game-logos/sun.png' },
  'moon':             { label: 'Luna',             bg: '#120038', logo: 'game-logos/moon.png' },
  'ultra-sun':        { label: 'Ultrasol',         bg: '#421500', logo: 'game-logos/ultra-sun.png' },
  'ultra-moon':       { label: 'Ultraluna',        bg: '#070e40', logo: 'game-logos/ultra-moon.png' },
  'lets-go-pikachu':  { label: "Let's Go Pikachu", bg: '#3a2a00', logo: 'game-logos/lets-go-pikachu.png' },
  'lets-go-eevee':    { label: "Let's Go Eevee",   bg: '#2e1800', logo: 'game-logos/lets-go-eevee.png' },
  'sword':            { label: 'Espada',           bg: '#002244', logo: 'game-logos/sword.png' },
  'shield':           { label: 'Escudo',           bg: '#420808', logo: 'game-logos/shield.png' },
  'brilliant-diamond':{ label: 'Diamante Brill.',  bg: '#0e1e38', logo: 'game-logos/brilliant-diamond.png' },
  'shining-pearl':    { label: 'Perla Reluc.',     bg: '#3e0e20', logo: 'game-logos/shining-pearl.png' },
  'legends-arceus':   { label: 'Leyendas: Arceus', bg: '#1e1000', logo: 'game-logos/legends-arceus.png' },
  'scarlet':          { label: 'Escarlata',        bg: '#380000', logo: 'game-logos/scarlet.png' },
  'violet':           { label: 'Púrpura',          bg: '#130025', logo: 'game-logos/violet.png' },
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <a routerLink="/pokemon" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
          Volver
        </a>
        <h1 class="page-title">Mi perfil</h1>
      </div>

      <div class="profile-layout">

        <!-- ── LEFT: identity ── -->
        <div class="card">
          <div class="card-title">Identidad</div>

          <!-- Avatar -->
          <div class="avatar-section">
            <div class="avatar-wrap" (click)="avatarInput.click()" [class.uploading]="avatarUploading()">
              <img [src]="auth.currentUser()?.pictureUrl || 'assets/default-avatar.png'"
                   class="avatar-img" referrerpolicy="no-referrer" [alt]="auth.currentUser()?.name" />
              <div class="avatar-overlay">
                <div class="mini-spinner" *ngIf="avatarUploading()"></div>
                <ng-container *ngIf="!avatarUploading()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="22" height="22">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span class="overlay-text">Cambiar foto</span>
                </ng-container>
              </div>
              <input #avatarInput type="file" accept="image/*" style="display:none" (change)="onAvatarChange($event)" />
            </div>
            <p class="avatar-hint">JPG, PNG, WebP · máx 5 MB</p>
          </div>

          <!-- Name -->
          <label class="form-label">Nombre de entrenador</label>
          <input class="form-input" [(ngModel)]="form.name" placeholder="Tu nombre" maxlength="30" />

          <!-- Bio -->
          <label class="form-label" style="margin-top:1rem">Descripción
            <span class="char-count">{{ form.bio.length }}/160</span>
          </label>
          <textarea class="form-textarea" [(ngModel)]="form.bio"
            placeholder="Cuéntanos algo sobre ti…" maxlength="160" rows="3"></textarea>

          <!-- Account info -->
          <div class="account-info">
            <div class="account-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {{ auth.currentUser()?.email }}
            </div>
            <div class="account-row">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
              <span [class]="'role-badge role-badge--' + (auth.currentUser()?.role ?? 'free')">
                {{ roleLabel() }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── RIGHT: favorites ── -->
        <div class="right-col">

          <!-- Pokémon favorito -->
          <div class="card">
            <div class="card-title">Pokémon favorito</div>

            <!-- Current selection -->
            <div class="fav-pokemon-card" *ngIf="favPokemon()">
              <img [src]="favPokemon()!.imageUrl" [alt]="favPokemon()!.name" class="fav-pokemon-art" />
              <div class="fav-pokemon-info">
                <span class="fav-pokemon-name">{{ capitalize(favPokemon()!.name) }}</span>
                <span class="fav-pokemon-id">#{{ favPokemon()!.id }}</span>
              </div>
              <button class="fav-clear-btn" (click)="clearFavPokemon()" title="Quitar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- Search -->
            <div class="pokemon-search-wrap">
              <div class="pokemon-search-row">
                <input
                  class="form-input pokemon-search-input"
                  [(ngModel)]="pokemonQuery"
                  (ngModelChange)="onPokemonQueryChange()"
                  (focus)="ensurePokemonList()"
                  (blur)="hideDropdownDelayed()"
                  placeholder="Busca un Pokémon…"
                  autocomplete="off" />
                <div class="search-loading" *ngIf="listLoading()">
                  <div class="mini-spinner dark"></div>
                </div>
              </div>

              <!-- Dropdown -->
              <div class="pokemon-dropdown" *ngIf="showDropdown() && pokemonResults().length">
                <button *ngFor="let p of pokemonResults()"
                  class="pokemon-drop-item"
                  (mousedown)="selectPokemon(p)">
                  <img [src]="sprite(p.id)" [alt]="p.name" class="drop-sprite" />
                  <span class="drop-name">{{ capitalize(p.name) }}</span>
                  <span class="drop-id">#{{ p.id }}</span>
                </button>
              </div>
              <p class="no-results" *ngIf="showDropdown() && pokemonQuery.length >= 2 && !pokemonResults().length && !listLoading()">
                No se encontró ningún Pokémon
              </p>
            </div>
          </div>

          <!-- Juego favorito -->
          <div class="card">
            <div class="card-title">Juego favorito</div>
            <div class="game-grid">
              <button *ngFor="let key of gameKeys"
                class="game-btn"
                [class.selected]="form.favoriteGame === key"
                [style.background]="GAME_META[key].bg"
                [title]="GAME_META[key].label"
                (click)="toggleGame(key)">
                <img [src]="GAME_META[key].logo" [alt]="GAME_META[key].label" class="game-btn-img" />
              </button>
            </div>
            <p class="selected-game-name" *ngIf="form.favoriteGame">
              {{ GAME_META[form.favoriteGame]?.label }}
            </p>
          </div>

        </div><!-- /right-col -->
      </div><!-- /profile-layout -->

      <!-- Save bar -->
      <div class="save-bar">
        <span class="save-success" *ngIf="saved()">
          <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
          Guardado
        </span>
        <span class="save-error" *ngIf="saveError()">{{ saveError() }}</span>
        <button class="btn-save" (click)="save()" [disabled]="saving() || !form.name.trim()">
          <div class="mini-spinner light" *ngIf="saving()"></div>
          <ng-container *ngIf="!saving()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Guardar cambios
          </ng-container>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 960px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
    .back-btn {
      display: flex; align-items: center; gap: .35rem;
      font-size: .84rem; font-weight: 600; color: #888;
      text-decoration: none; padding: .4rem .75rem;
      border-radius: 8px; transition: all .2s;
    }
    .back-btn:hover { background: #f0f0f0; color: #333; }
    .page-title { font-size: 1.6rem; font-weight: 800; color: #1a1a2e; margin: 0; }

    /* Layout */
    .profile-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 1.25rem;
      align-items: start;
    }
    @media (max-width: 700px) {
      .profile-layout { grid-template-columns: 1fr; }
    }

    .right-col { display: flex; flex-direction: column; gap: 1.25rem; }

    /* Card */
    .card {
      background: white; border-radius: 18px;
      padding: 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,.07);
    }
    .card-title {
      font-size: .7rem; font-weight: 800; color: #aaa;
      text-transform: uppercase; letter-spacing: .7px;
      margin-bottom: 1.25rem;
    }

    /* Avatar */
    .avatar-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 1.5rem; gap: .5rem; }
    .avatar-wrap {
      position: relative; width: 100px; height: 100px;
      border-radius: 50%; cursor: pointer; overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,.15);
      transition: transform .2s;
    }
    .avatar-wrap:hover { transform: scale(1.04); }
    .avatar-wrap.uploading { cursor: default; }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    .avatar-overlay {
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(0,0,0,.52);
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .3rem;
      opacity: 0; transition: opacity .2s;
    }
    .avatar-wrap:hover .avatar-overlay,
    .avatar-wrap.uploading .avatar-overlay { opacity: 1; }
    .overlay-text { font-size: .64rem; font-weight: 700; color: white; letter-spacing: .3px; }
    .avatar-hint { font-size: .7rem; color: #bbb; }

    /* Form */
    .form-label {
      display: flex; align-items: center; justify-content: space-between;
      font-size: .72rem; font-weight: 700; color: #888;
      text-transform: uppercase; letter-spacing: .5px; margin-bottom: .45rem;
    }
    .char-count { font-size: .68rem; font-weight: 400; color: #bbb; text-transform: none; }
    .form-input {
      width: 100%; padding: .6rem .85rem; border: 1.5px solid #e8e8e8;
      border-radius: 10px; font-size: .92rem; outline: none;
      box-sizing: border-box; transition: border .2s; background: white;
    }
    .form-input:focus { border-color: #e63946; }
    .form-textarea {
      width: 100%; padding: .6rem .85rem; border: 1.5px solid #e8e8e8;
      border-radius: 10px; font-size: .88rem; outline: none;
      box-sizing: border-box; transition: border .2s; resize: vertical;
      font-family: inherit; line-height: 1.5; background: white;
    }
    .form-textarea:focus { border-color: #e63946; }

    /* Account info */
    .account-info { margin-top: 1.25rem; display: flex; flex-direction: column; gap: .5rem; }
    .account-row {
      display: flex; align-items: center; gap: .5rem;
      font-size: .8rem; color: #888;
    }
    .role-badge {
      padding: .18rem .55rem; border-radius: 20px;
      font-size: .7rem; font-weight: 800; letter-spacing: .2px;
    }
    .role-badge--free    { background: rgba(156,163,175,.15); color: #6b7280; }
    .role-badge--premium { background: rgba(251,191,36,.18);  color: #b45309; }
    .role-badge--admin   { background: rgba(139,92,246,.18);  color: #7c3aed; }

    /* Favorite Pokémon */
    .fav-pokemon-card {
      display: flex; align-items: center; gap: .85rem;
      background: linear-gradient(135deg, #f8f8ff, #f0f4ff);
      border: 1.5px solid #e0e8ff; border-radius: 14px;
      padding: .75rem 1rem; margin-bottom: .85rem;
      position: relative;
    }
    .fav-pokemon-art { width: 64px; height: 64px; object-fit: contain; }
    .fav-pokemon-info { flex: 1; }
    .fav-pokemon-name { display: block; font-size: 1rem; font-weight: 800; color: #1a1a2e; }
    .fav-pokemon-id   { font-size: .78rem; color: #aaa; }
    .fav-clear-btn {
      position: absolute; top: .5rem; right: .5rem;
      background: rgba(0,0,0,.06); border: none; border-radius: 6px;
      padding: .3rem; cursor: pointer; color: #aaa; transition: all .2s;
    }
    .fav-clear-btn:hover { background: rgba(230,57,70,.1); color: #e63946; }

    /* Pokémon search */
    .pokemon-search-wrap { position: relative; }
    .pokemon-search-row { position: relative; }
    .pokemon-search-input { padding-right: 2.5rem; }
    .search-loading {
      position: absolute; right: .75rem; top: 50%;
      transform: translateY(-50%);
    }
    .pokemon-dropdown {
      position: absolute; top: calc(100% + .3rem); left: 0; right: 0;
      background: white; border: 1.5px solid #e8e8e8; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,.12);
      z-index: 50; overflow: hidden; max-height: 260px; overflow-y: auto;
    }
    .pokemon-drop-item {
      display: flex; align-items: center; gap: .6rem;
      width: 100%; padding: .5rem .85rem;
      background: none; border: none; cursor: pointer;
      text-align: left; transition: background .15s;
    }
    .pokemon-drop-item:hover { background: #f8f8f8; }
    .drop-sprite { width: 36px; height: 36px; object-fit: contain; flex-shrink: 0; }
    .drop-name { flex: 1; font-size: .88rem; font-weight: 600; color: #1a1a2e; }
    .drop-id   { font-size: .75rem; color: #bbb; }
    .no-results { font-size: .8rem; color: #bbb; margin: .5rem 0 0; text-align: center; }

    /* Game grid */
    .game-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: .35rem; }
    .game-btn {
      border: 2px solid transparent; border-radius: 8px;
      padding: .25rem; cursor: pointer; display: flex;
      align-items: center; justify-content: center;
      transition: all .15s; height: 40px;
    }
    .game-btn:hover { border-color: rgba(255,255,255,.35); transform: scale(1.06); }
    .game-btn.selected { border-color: #e63946; box-shadow: 0 0 0 2px #e63946; }
    .game-btn-img { max-width: 100%; max-height: 26px; object-fit: contain; filter: drop-shadow(0 1px 2px rgba(0,0,0,.35)); }
    .selected-game-name { font-size: .8rem; font-weight: 600; color: #555; text-align: center; margin: .5rem 0 0; }

    /* Save bar */
    .save-bar {
      display: flex; align-items: center; justify-content: flex-end;
      gap: 1rem; margin-top: 1.5rem;
      padding-top: 1.25rem; border-top: 1.5px solid #f0f0f0;
    }
    .save-success { display: flex; align-items: center; gap: .35rem; font-size: .84rem; font-weight: 600; color: #22c55e; }
    .save-error   { font-size: .84rem; color: #e63946; }
    .btn-save {
      display: flex; align-items: center; gap: .5rem;
      padding: .6rem 1.4rem; background: #e63946; color: white;
      border: none; border-radius: 11px; font-size: .9rem;
      font-weight: 700; cursor: pointer; transition: background .2s;
    }
    .btn-save:hover:not(:disabled) { background: #c1121f; }
    .btn-save:disabled { opacity: .5; cursor: not-allowed; }

    /* Spinners */
    .mini-spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid rgba(0,0,0,.12); border-top-color: #e63946;
      animation: spin .7s linear infinite; flex-shrink: 0;
    }
    .mini-spinner.dark { border-color: rgba(0,0,0,.1); border-top-color: #555; }
    .mini-spinner.light { border-color: rgba(255,255,255,.3); border-top-color: white; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Dark mode ── */
    :host-context(html.dark) .page-title     { color: white; }
    :host-context(html.dark) .back-btn       { color: rgba(255,255,255,.5); }
    :host-context(html.dark) .back-btn:hover { background: rgba(255,255,255,.07); color: rgba(255,255,255,.85); }
    :host-context(html.dark) .card           { background: #1a1a2e; box-shadow: 0 2px 14px rgba(0,0,0,.35); }
    :host-context(html.dark) .card-title     { color: rgba(255,255,255,.3); }
    :host-context(html.dark) .form-input     { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.1); color: white; }
    :host-context(html.dark) .form-input:focus { border-color: #e63946; }
    :host-context(html.dark) .form-textarea  { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.1); color: white; }
    :host-context(html.dark) .form-textarea:focus { border-color: #e63946; }
    :host-context(html.dark) .form-label     { color: rgba(255,255,255,.35); }
    :host-context(html.dark) .char-count     { color: rgba(255,255,255,.25); }
    :host-context(html.dark) .account-row    { color: rgba(255,255,255,.4); }
    :host-context(html.dark) .fav-pokemon-card { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.1); }
    :host-context(html.dark) .fav-pokemon-name { color: white; }
    :host-context(html.dark) .pokemon-dropdown { background: #1e1e38; border-color: rgba(255,255,255,.1); }
    :host-context(html.dark) .pokemon-drop-item:hover { background: rgba(255,255,255,.05); }
    :host-context(html.dark) .drop-name      { color: white; }
    :host-context(html.dark) .selected-game-name { color: rgba(255,255,255,.55); }
    :host-context(html.dark) .save-bar       { border-top-color: rgba(255,255,255,.07); }
  `]
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthService);
  private http = inject(HttpClient);

  readonly GAME_META = GAME_META;
  readonly gameKeys = Object.keys(GAME_META);

  form = { name: '', bio: '', favoriteGame: '' };

  favPokemon   = signal<{ id: number; name: string; imageUrl: string } | null>(null);
  pokemonQuery = '';
  pokemonList  = signal<PokemonEntry[]>([]);
  listLoading  = signal(false);
  pokemonResults = signal<PokemonEntry[]>([]);
  showDropdown = signal(false);

  saving    = signal(false);
  saved     = signal(false);
  saveError = signal('');
  avatarUploading = signal(false);

  ngOnInit() {
    const u = this.auth.currentUser();
    if (!u) return;
    this.form.name = u.name;
    this.form.bio  = u.bio ?? '';
    this.form.favoriteGame = u.favoriteGame ?? '';
    if (u.favoritePokemonId) {
      this.favPokemon.set({
        id:       u.favoritePokemonId,
        name:     u.favoritePokemonName ?? '',
        imageUrl: u.favoritePokemonImageUrl ?? this.artwork(u.favoritePokemonId),
      });
    }
  }

  // ── Pokémon search ──────────────────────────────────────────────────────────

  ensurePokemonList() {
    if (this.pokemonList().length) return;
    this.listLoading.set(true);
    this.http.get<{ results: { name: string; url: string }[] }>(
      'https://pokeapi.co/api/v2/pokemon?limit=1300&offset=0'
    ).subscribe({
      next: res => {
        const list = res.results
          .map(r => ({ name: r.name, id: this.idFromUrl(r.url) }))
          .filter(p => p.id > 0 && p.id <= 1025);
        this.pokemonList.set(list);
        this.listLoading.set(false);
        this.filterResults();
      },
      error: () => this.listLoading.set(false)
    });
  }

  onPokemonQueryChange() {
    this.filterResults();
    this.showDropdown.set(true);
  }

  private filterResults() {
    const q = this.pokemonQuery.toLowerCase().trim();
    if (q.length < 2) { this.pokemonResults.set([]); return; }
    const filtered = this.pokemonList()
      .filter(p => p.name.includes(q))
      .slice(0, 8);
    this.pokemonResults.set(filtered);
  }

  selectPokemon(p: PokemonEntry) {
    this.favPokemon.set({ id: p.id, name: p.name, imageUrl: this.artwork(p.id) });
    this.pokemonQuery = '';
    this.pokemonResults.set([]);
    this.showDropdown.set(false);
  }

  clearFavPokemon() { this.favPokemon.set(null); }

  hideDropdownDelayed() {
    setTimeout(() => this.showDropdown.set(false), 150);
  }

  // ── Game ────────────────────────────────────────────────────────────────────

  toggleGame(key: string) {
    this.form.favoriteGame = this.form.favoriteGame === key ? '' : key;
  }

  // ── Avatar ──────────────────────────────────────────────────────────────────

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarUploading.set(true);
    this.auth.uploadAvatar(file).subscribe({
      next: () => this.avatarUploading.set(false),
      error: err => {
        this.avatarUploading.set(false);
        this.saveError.set(err?.error?.message ?? 'Error al subir la imagen');
      }
    });
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  save() {
    if (!this.form.name.trim()) return;
    this.saving.set(true);
    this.saveError.set('');
    const pk = this.favPokemon();
    this.auth.updateProfile({
      name: this.form.name.trim(),
      bio: this.form.bio || null,
      favoriteGame: this.form.favoriteGame || null,
      favoritePokemonId: pk?.id ?? null,
      favoritePokemonName: pk?.name ?? null,
      favoritePokemonImageUrl: pk?.imageUrl ?? null,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: err => {
        this.saving.set(false);
        this.saveError.set(err?.error?.message ?? 'Error al guardar');
      }
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  roleLabel(): string {
    const r = this.auth.currentUser()?.role;
    if (r === 'premium') return 'Premium';
    if (r === 'admin')   return 'Admin';
    return 'Gratis';
  }

  capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  sprite(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  }

  private artwork(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  private idFromUrl(url: string): number {
    const m = url.match(/\/pokemon\/(\d+)\//);
    return m ? parseInt(m[1], 10) : 0;
  }
}
