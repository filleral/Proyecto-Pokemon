using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PokemonBackend.Data;
using PokemonBackend.DTOs;
using PokemonBackend.Models;

namespace PokemonBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FavoritesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var favorites = await db.Favorites.OrderByDescending(f => f.CreatedAt).ToListAsync();
        return Ok(favorites);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AddFavoriteRequest request)
    {
        var exists = await db.Favorites.AnyAsync(f => f.PokemonId == request.PokemonId);
        if (exists) return Conflict(new { message = "Already in favorites" });

        var favorite = new Favorite
        {
            PokemonId = request.PokemonId,
            PokemonName = request.PokemonName,
            PokemonImageUrl = request.PokemonImageUrl
        };

        db.Favorites.Add(favorite);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), favorite);
    }

    [HttpDelete("{pokemonId:int}")]
    public async Task<IActionResult> Remove(int pokemonId)
    {
        var favorite = await db.Favorites.FirstOrDefaultAsync(f => f.PokemonId == pokemonId);
        if (favorite is null) return NotFound();

        db.Favorites.Remove(favorite);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
