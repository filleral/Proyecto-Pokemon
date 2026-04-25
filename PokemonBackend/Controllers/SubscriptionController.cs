using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PokemonBackend.Data;
using PokemonBackend.DTOs;

namespace PokemonBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubscriptionController(AppDbContext db, AuthController auth) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("upgrade")]
    public async Task<IActionResult> Upgrade([FromBody] UpgradeRequest req)
    {
        var user = await db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == UserId);
        if (user is null) return NotFound();

        user.RoleId = 2; // premium (both plans share the same role)
        await db.SaveChangesAsync();
        await db.Entry(user).Reference(u => u.Role).LoadAsync();

        var token = auth.GenerateJwt(user);
        return Ok(new AuthResponse(token, new UserDto(user.Id, user.Email, user.Name, user.PictureUrl, user.Role!.Name, user.DarkMode,
            user.Bio, user.FavoritePokemonId, user.FavoritePokemonName, user.FavoritePokemonImageUrl, user.FavoriteGame)));
    }
}

public record UpgradeRequest(string Plan); // "monthly" | "annual"
