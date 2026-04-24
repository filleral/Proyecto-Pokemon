using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PokemonBackend.Data;
using PokemonBackend.DTOs;
using PokemonBackend.Models;

namespace PokemonBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GameProgressController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.GameProgresses
            .Where(g => g.UserId == UserId)
            .Include(g => g.CaughtPokemons)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new GameProgressSummaryDto(
                g.Id, g.GameVersion, g.TrainerName, g.StartedAt, g.CreatedAt,
                g.CaughtPokemons.Count(c => c.Seen),
                g.CaughtPokemons.Count(c => c.CaughtNormal),
                g.CaughtPokemons.Count(c => c.CaughtShiny),
                g.FinishedAt))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var g = await db.GameProgresses
            .Include(g => g.CaughtPokemons)
            .FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (g is null) return NotFound();

        return Ok(new GameProgressDetailDto(
            g.Id, g.GameVersion, g.TrainerName, g.StartedAt, g.CreatedAt,
            g.CaughtPokemons.Select(c => new CaughtPokemonDto(c.PokemonId, c.PokemonName, c.Seen, c.CaughtNormal, c.CaughtShiny)).ToList(),
            g.FinishedAt));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProgressRequest req)
    {
        var progress = new GameProgress
        {
            UserId = UserId,
            GameVersion = req.GameVersion,
            TrainerName = req.TrainerName,
            StartedAt = req.StartedAt,
        };
        db.GameProgresses.Add(progress);
        await db.SaveChangesAsync();
        return Ok(new GameProgressSummaryDto(progress.Id, progress.GameVersion, progress.TrainerName, progress.StartedAt, progress.CreatedAt, 0, 0, 0, null));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var g = await db.GameProgresses.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (g is null) return NotFound();
        db.GameProgresses.Remove(g);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/finish")]
    public async Task<IActionResult> Finish(int id)
    {
        var g = await db.GameProgresses.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (g is null) return NotFound();
        g.FinishedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { finishedAt = g.FinishedAt });
    }

    [HttpPost("{id}/resume")]
    public async Task<IActionResult> Resume(int id)
    {
        var g = await db.GameProgresses.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (g is null) return NotFound();
        g.FinishedAt = null;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}/reset")]
    public async Task<IActionResult> Reset(int id)
    {
        var g = await db.GameProgresses.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (g is null) return NotFound();
        var caught = db.CaughtPokemons.Where(c => c.GameProgressId == id);
        db.CaughtPokemons.RemoveRange(caught);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/caught")]
    public async Task<IActionResult> UpsertCaught(int id, [FromBody] UpsertCaughtRequest req)
    {
        var g = await db.GameProgresses.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (g is null) return NotFound();

        var existing = await db.CaughtPokemons
            .FirstOrDefaultAsync(c => c.GameProgressId == id && c.PokemonId == req.PokemonId);

        if (existing is null)
        {
            db.CaughtPokemons.Add(new CaughtPokemon
            {
                GameProgressId = id,
                PokemonId = req.PokemonId,
                PokemonName = req.PokemonName,
                Seen = req.Seen,
                CaughtNormal = req.CaughtNormal,
                CaughtShiny = req.CaughtShiny,
            });
        }
        else
        {
            existing.Seen = req.Seen;
            existing.CaughtNormal = req.CaughtNormal;
            existing.CaughtShiny = req.CaughtShiny;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return Ok(new CaughtPokemonDto(req.PokemonId, req.PokemonName, req.Seen, req.CaughtNormal, req.CaughtShiny));
    }

    [HttpDelete("{id}/caught/{pokemonId}")]
    public async Task<IActionResult> RemoveCaught(int id, int pokemonId)
    {
        var c = await db.CaughtPokemons
            .FirstOrDefaultAsync(c => c.GameProgressId == id && c.PokemonId == pokemonId);
        if (c is null) return NotFound();

        var g = await db.GameProgresses.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (g is null) return Forbid();

        db.CaughtPokemons.Remove(c);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
