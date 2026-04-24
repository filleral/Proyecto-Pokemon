import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TYPE_COLORS, TYPE_NAMES_ES } from '../../core/models/pokemon.model';

@Component({
  selector: 'app-type-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="type-badge" [style.background]="color" [style.color]="textColor">
      {{ typeName }}
    </span>
  `,
  styles: [`
    .type-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: capitalize;
      letter-spacing: 0.5px;
    }
  `]
})
export class TypeBadgeComponent {
  @Input() type = '';

  get typeName(): string { return TYPE_NAMES_ES[this.type] ?? this.type; }

  get color(): string {
    return TYPE_COLORS[this.type] ?? '#888';
  }

  get textColor(): string {
    const light = ['electric', 'normal', 'ground'];
    return light.includes(this.type) ? '#333' : '#fff';
  }
}
