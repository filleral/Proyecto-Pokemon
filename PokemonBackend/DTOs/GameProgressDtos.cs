namespace PokemonBackend.DTOs;

public record CreateProgressRequest(string GameVersion, string TrainerName, DateTime StartedAt);

public record UpsertCaughtRequest(int PokemonId, string PokemonName, bool Seen, bool CaughtNormal, bool CaughtShiny);

public record CaughtPokemonDto(int PokemonId, string PokemonName, bool Seen, bool CaughtNormal, bool CaughtShiny);

public record GameProgressSummaryDto(
    int Id, string GameVersion, string TrainerName, DateTime StartedAt, DateTime CreatedAt,
    int TotalSeen, int TotalCaught, int TotalShiny, DateTime? FinishedAt);

public record GameProgressDetailDto(
    int Id, string GameVersion, string TrainerName, DateTime StartedAt, DateTime CreatedAt,
    List<CaughtPokemonDto> CaughtPokemons, DateTime? FinishedAt);
