namespace PokemonBackend.DTOs;

public record GoogleLoginRequest(string IdToken);

public record AuthResponse(
    string Token,
    UserDto User
);

public record UserDto(
    int Id,
    string Email,
    string Name,
    string? PictureUrl,
    string Role,
    bool DarkMode,
    string? Bio,
    int? FavoritePokemonId,
    string? FavoritePokemonName,
    string? FavoritePokemonImageUrl,
    string? FavoriteGame
);

public record ThemeRequest(bool DarkMode);

public record UpdateProfileRequest(
    string Name,
    string? Bio,
    string? FavoriteGame,
    int? FavoritePokemonId,
    string? FavoritePokemonName,
    string? FavoritePokemonImageUrl
);
