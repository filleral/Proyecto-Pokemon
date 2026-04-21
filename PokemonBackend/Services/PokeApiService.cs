using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using PokemonBackend.DTOs;

namespace PokemonBackend.Services;

public class PokeApiService(HttpClient httpClient, IMemoryCache cache)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public async Task<PokemonListResponse?> GetPokemonListAsync(int limit = 20, int offset = 0)
    {
        var cacheKey = $"list_{limit}_{offset}";
        if (cache.TryGetValue(cacheKey, out PokemonListResponse? cached))
            return cached;

        var response = await httpClient.GetAsync($"pokemon?limit={limit}&offset={offset}");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<PokemonListResponse>(json, JsonOptions);

        cache.Set(cacheKey, result, TimeSpan.FromMinutes(30));
        return result;
    }

    public async Task<PokemonDetail?> GetPokemonByIdOrNameAsync(string idOrName)
    {
        var cacheKey = $"pokemon_{idOrName}";
        if (cache.TryGetValue(cacheKey, out PokemonDetail? cached))
            return cached;

        var response = await httpClient.GetAsync($"pokemon/{idOrName}");
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<PokemonDetail>(json, JsonOptions);

        cache.Set(cacheKey, result, TimeSpan.FromHours(1));
        return result;
    }

    public async Task<object?> GetTypeAsync(string typeName)
    {
        var cacheKey = $"type_{typeName}";
        if (cache.TryGetValue(cacheKey, out object? cached))
            return cached;

        var response = await httpClient.GetAsync($"type/{typeName}");
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<object>(json, JsonOptions);

        cache.Set(cacheKey, result, TimeSpan.FromHours(2));
        return result;
    }

    public async Task<object?> GetGenerationAsync(int id)
    {
        var cacheKey = $"gen_{id}";
        if (cache.TryGetValue(cacheKey, out object? cached))
            return cached;

        var response = await httpClient.GetAsync($"generation/{id}");
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<object>(json, JsonOptions);

        cache.Set(cacheKey, result, TimeSpan.FromHours(2));
        return result;
    }
}
