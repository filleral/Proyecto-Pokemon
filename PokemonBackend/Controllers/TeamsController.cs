using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PokemonBackend.Data;
using PokemonBackend.DTOs;
using PokemonBackend.Models;

namespace PokemonBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var teams = await db.Teams.Include(t => t.Members).OrderByDescending(t => t.CreatedAt).ToListAsync();
        return Ok(teams);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var team = await db.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == id);
        return team is null ? NotFound() : Ok(team);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTeamRequest request)
    {
        var team = new PokemonTeam { Name = request.Name };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = team.Id }, team);
    }

    [HttpPost("{id:int}/members")]
    public async Task<IActionResult> AddMember(int id, [FromBody] AddTeamMemberRequest request)
    {
        var team = await db.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == id);
        if (team is null) return NotFound();
        if (team.Members.Count >= 6) return BadRequest(new { message = "Team is full (max 6)" });
        if (team.Members.Any(m => m.PokemonId == request.PokemonId))
            return Conflict(new { message = "Pokemon already in team" });

        var member = new TeamMember
        {
            PokemonTeamId = id,
            PokemonId = request.PokemonId,
            PokemonName = request.PokemonName,
            PokemonImageUrl = request.PokemonImageUrl,
            Slot = request.Slot
        };

        team.Members.Add(member);
        await db.SaveChangesAsync();
        return Ok(team);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var team = await db.Teams.FindAsync(id);
        if (team is null) return NotFound();
        db.Teams.Remove(team);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}/members/{pokemonId:int}")]
    public async Task<IActionResult> RemoveMember(int id, int pokemonId)
    {
        var member = await db.TeamMembers.FirstOrDefaultAsync(m => m.PokemonTeamId == id && m.PokemonId == pokemonId);
        if (member is null) return NotFound();
        db.TeamMembers.Remove(member);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
