import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProgressService } from './progress.service';
import { TeamsService } from './teams.service';
import { ImportOptions, ImportResult, ParsedSaveData } from '../models/save-parser.types';

@Injectable({ providedIn: 'root' })
export class SaveImportService {
  private progress = inject(ProgressService);
  private teams    = inject(TeamsService);

  /**
   * Executes the full import pipeline from parsed save data.
   * parsedData may be null if the binary parser is not yet available —
   * in that case only the progress entry is created (no Pokédex/team data).
   */
  import(parsedData: ParsedSaveData | null, opts: ImportOptions): Observable<ImportResult> {
    const result: ImportResult = { progressId: null, teamId: null, pokemonImported: 0, teamImported: 0 };

    // Step 1: create progress entry
    const createProgress$ = this.progress.create(
      opts.gameVersion,
      opts.trainerName,
      new Date(opts.startedAt)
    );

    return createProgress$.pipe(
      switchMap(p => {
        result.progressId = p.id;

        if (!parsedData || !opts.importPokedex) {
          return of(result);
        }

        // Build bulk upsert entries from seen + caught + shiny lists
        const map_ = new Map<number, { pokemonId: number; pokemonName: string; seen: boolean; caughtNormal: boolean; caughtShiny: boolean }>();

        for (const id of parsedData.seenIds) {
          map_.set(id, { pokemonId: id, pokemonName: `pokemon-${id}`, seen: true, caughtNormal: false, caughtShiny: false });
        }
        for (const pk of parsedData.caughtPokemon) {
          const existing = map_.get(pk.pokemonId);
          if (existing) {
            existing.pokemonName = pk.pokemonName;
            existing.seen = true;
            existing.caughtNormal = true;
          } else {
            map_.set(pk.pokemonId, { pokemonId: pk.pokemonId, pokemonName: pk.pokemonName, seen: true, caughtNormal: true, caughtShiny: false });
          }
        }
        for (const pk of parsedData.shinyCaught) {
          const existing = map_.get(pk.pokemonId);
          if (existing) {
            existing.caughtShiny = true;
          } else {
            map_.set(pk.pokemonId, { pokemonId: pk.pokemonId, pokemonName: pk.pokemonName, seen: true, caughtNormal: true, caughtShiny: true });
          }
        }

        const entries = Array.from(map_.values()).filter(e => e.pokemonId > 0);

        if (!entries.length) return of(result);

        return this.progress.bulkUpsert(p.id, entries).pipe(
          map(r => { result.pokemonImported = r.upserted; return result; })
        );
      }),
      switchMap(r => {
        if (!parsedData || !opts.importTeam || !parsedData.party.length) {
          return of(r);
        }

        const sprite = (id: number) =>
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

        const payload = {
          name: `Equipo de ${opts.trainerName} (${opts.gameVersion})`,
          members: parsedData.party.map((pk, idx) => ({
            pokemonId:       pk.pokemonId,
            pokemonName:     pk.pokemonName,
            pokemonImageUrl: sprite(pk.pokemonId),
            slot:            pk.slot != null ? pk.slot : idx + 1,
            heldItem: null, ability: null, nature: null,
            move1: null, move2: null, move3: null, move4: null,
            evHp: 0, evAtk: 0, evDef: 0, evSpAtk: 0, evSpDef: 0, evSpeed: 0,
            ivHp: 0, ivAtk: 0, ivDef: 0, ivSpAtk: 0, ivSpDef: 0, ivSpeed: 0,
          }))
        };

        return this.teams.importTeam(payload).pipe(
          map(() => { r.teamImported = parsedData.party.length; return r; })
        );
      })
    );
  }
}
