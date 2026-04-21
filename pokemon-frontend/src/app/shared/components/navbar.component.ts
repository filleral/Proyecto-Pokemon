import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <a routerLink="/" class="brand-link">
          <div class="pokeball-icon"></div>
          <span class="brand-text">Pokédex</span>
        </a>
      </div>
      <ul class="nav-links">
        <li><a routerLink="/pokemon" routerLinkActive="active" [routerLinkActiveOptions]="{exact:false}">Explorar</a></li>
        <li><a routerLink="/favorites" routerLinkActive="active">Favoritos</a></li>
        <li><a routerLink="/teams" routerLinkActive="active">Equipos</a></li>
      </ul>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      height: 64px;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
    }
    .pokeball-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(180deg, #e63946 50%, #fff 50%);
      border: 3px solid #1a1a2e;
      position: relative;
    }
    .pokeball-icon::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: white;
      border: 2px solid #1a1a2e;
      margin-top: -1px;
    }
    .pokeball-icon::before {
      content: '';
      position: absolute;
      top: 45%;
      left: -3px;
      right: -3px;
      height: 2px;
      background: #1a1a2e;
    }
    .brand-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: -0.5px;
    }
    .nav-links {
      display: flex;
      gap: 0.25rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .nav-links a {
      display: block;
      padding: 0.5rem 1rem;
      text-decoration: none;
      color: #555;
      font-weight: 500;
      font-size: 0.9rem;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .nav-links a:hover, .nav-links a.active {
      color: #e63946;
      background: rgba(230,57,70,0.08);
    }
  `]
})
export class NavbarComponent {}
