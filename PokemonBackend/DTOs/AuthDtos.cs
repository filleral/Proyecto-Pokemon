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
    string? PictureUrl
);
