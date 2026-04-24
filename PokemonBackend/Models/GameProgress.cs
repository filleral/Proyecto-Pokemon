namespace PokemonBackend.Models;

public class GameProgress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string GameVersion { get; set; } = "";
    public string TrainerName { get; set; } = "";
    public DateTime StartedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }
    public List<CaughtPokemon> CaughtPokemons { get; set; } = [];
}
