using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PokemonBackend.Data;
using PokemonBackend.DTOs;
using PokemonBackend.Models;

namespace PokemonBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext db, IConfiguration config) : ControllerBase
{
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

        var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);
        if (user is null)
        {
            user = new User
            {
                GoogleId = payload.Subject,
                Email = payload.Email,
                Name = payload.Name,
                PictureUrl = payload.Picture
            };
            db.Users.Add(user);
        }
        else
        {
            user.Name = payload.Name;
            user.PictureUrl = payload.Picture;
        }

        await db.SaveChangesAsync();

        var token = GenerateJwt(user);
        return Ok(new AuthResponse(token, new UserDto(user.Id, user.Email, user.Name, user.PictureUrl)));
    }

    private string GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name)
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
