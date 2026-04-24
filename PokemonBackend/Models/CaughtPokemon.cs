namespace PokemonBackend.Models;

public class CaughtPokemon
{
    public int Id { get; set; }
    public int GameProgressId { get; set; }
    public GameProgress GameProgress { get; set; } = null!;
    public int PokemonId { get; set; }
    public string PokemonName { get; set; } = "";
    public bool Seen { get; set; }
    public bool CaughtNormal { get; set; }
    public bool CaughtShiny { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
