namespace PokemonBackend.Models;

public class User
{
    public int Id { get; set; }
    public string GoogleId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? PictureUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int RoleId { get; set; } = 1; // FK → Role (1=free, 2=premium, 3=admin)
    public Role? Role { get; set; }

    public bool DarkMode { get; set; } = false;

    // Profile extras
    public string? Bio { get; set; }
    public int? FavoritePokemonId { get; set; }
    public string? FavoritePokemonName { get; set; }
    public string? FavoritePokemonImageUrl { get; set; }
    public string? FavoriteGame { get; set; }

    public List<Favorite> Favorites { get; set; } = [];
    public List<PokemonTeam> Teams { get; set; } = [];
}
