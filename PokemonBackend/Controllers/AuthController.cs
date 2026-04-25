using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PokemonBackend.Data;
using PokemonBackend.DTOs;
using PokemonBackend.Models;

namespace PokemonBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext db, IConfiguration config, IWebHostEnvironment env) : ControllerBase
{
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();
        var token = GenerateJwt(user);
        return Ok(new AuthResponse(token, ToDto(user)));
    }

    [HttpPatch("theme")]
    [Authorize]
    public async Task<IActionResult> UpdateTheme([FromBody] ThemeRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();
        user.DarkMode = req.DarkMode;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "El nombre es obligatorio" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();

        user.Name = req.Name.Trim();
        user.Bio = string.IsNullOrWhiteSpace(req.Bio) ? null : req.Bio.Trim();
        user.FavoriteGame = req.FavoriteGame;
        user.FavoritePokemonId = req.FavoritePokemonId;
        user.FavoritePokemonName = req.FavoritePokemonName;
        user.FavoritePokemonImageUrl = req.FavoritePokemonImageUrl;

        await db.SaveChangesAsync();
        return Ok(new AuthResponse(GenerateJwt(user), ToDto(user)));
    }

    [HttpPost("avatar")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No se recibió ningún archivo" });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" }.Contains(ext))
            return BadRequest(new { message = "Formato no soportado. Usa JPG, PNG, WebP o GIF." });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "La imagen no puede superar 5 MB" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();

        var webRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var avatarDir = Path.Combine(webRoot, "avatars");
        Directory.CreateDirectory(avatarDir);

        var filename = $"{userId}{ext}";
        using (var stream = new FileStream(Path.Combine(avatarDir, filename), FileMode.Create))
            await file.CopyToAsync(stream);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        user.PictureUrl = $"{baseUrl}/avatars/{filename}?t={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        await db.SaveChangesAsync();

        return Ok(new AuthResponse(GenerateJwt(user), ToDto(user)));
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [config["Google:ClientId"]!]
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);
        }
        catch
        {
            return Unauthorized(new { message = "Token de Google inválido" });
        }

        var user = await db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);

        if (user is null)
        {
            user = new User
            {
                GoogleId = payload.Subject,
                Email = payload.Email,
                Name = payload.Name,
                PictureUrl = payload.Picture,
                RoleId = 1
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            await db.Entry(user).Reference(u => u.Role).LoadAsync();
        }
        // On re-login: don't overwrite name/picture — user may have customized them

        var token = GenerateJwt(user);
        return Ok(new AuthResponse(token, ToDto(user)));
    }

    private static UserDto ToDto(User user) => new(
        user.Id, user.Email, user.Name, user.PictureUrl,
        user.Role!.Name, user.DarkMode,
        user.Bio, user.FavoritePokemonId, user.FavoritePokemonName,
        user.FavoritePokemonImageUrl, user.FavoriteGame
    );

    internal string GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role!.Name)
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(90),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
