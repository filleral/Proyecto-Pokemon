using Microsoft.AspNetCore.Mvc;
using PokemonBackend.Services;

namespace PokemonBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PokemonController(PokeApiService pokeApi) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] int limit = 20, [FromQuery] int offset = 0)
    {
        var result = await pokeApi.GetPokemonListAsync(limit, offset);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{idOrName}")]
    public async Task<IActionResult> GetPokemon(string idOrName)
    {
        var result = await pokeApi.GetPokemonByIdOrNameAsync(idOrName);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("type/{typeName}")]
    public async Task<IActionResult> GetType(string typeName)
    {
        var result = await pokeApi.GetTypeAsync(typeName);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("generation/{id:int}")]
    public async Task<IActionResult> GetGeneration(int id)
    {
        var result = await pokeApi.GetGenerationAsync(id);
        return result is null ? NotFound() : Ok(result);
    }
}
