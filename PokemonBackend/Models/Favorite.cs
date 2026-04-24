namespace PokemonBackend.Models;

public class Favorite
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public int PokemonId { get; set; }
    public string PokemonName { get; set; } = string.Empty;
    public string PokemonImageUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
