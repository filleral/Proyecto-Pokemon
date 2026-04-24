using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PokemonBackend.Data;
using PokemonBackend.DTOs;
using PokemonBackend.Models;

namespace PokemonBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeamsController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var teams = await db.Teams
            .Where(t => t.UserId == UserId)
            .Include(t => t.Members)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
        return Ok(teams);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var team = await db.Teams
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == UserId);
        return team is null ? NotFound() : Ok(team);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTeamRequest request)
    {
        var team = new PokemonTeam { UserId = UserId, Name = request.Name };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = team.Id }, team);
    }

    [HttpPost("{id:int}/members")]
    public async Task<IActionResult> AddMember(int id, [FromBody] AddTeamMemberRequest request)
    {
        var team = await db.Teams.Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == UserId);
        if (team is null) return NotFound();
        if (team.Members.Count >= 6) return BadRequest(new { message = "Team is full (max 6)" });
        if (team.Members.Any(m => m.PokemonId == request.PokemonId))
            return Conflict(new { message = "Pokemon already in team" });

        team.Members.Add(new TeamMember
        {
            PokemonTeamId = id,
            PokemonId = request.PokemonId,
            PokemonName = request.PokemonName,
            PokemonImageUrl = request.PokemonImageUrl,
            Slot = request.Slot
        });

        await db.SaveChangesAsync();
        return Ok(team);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var team = await db.Teams.FirstOrDefaultAsync(t => t.Id == id && t.UserId == UserId);
        if (team is null) return NotFound();
        db.Teams.Remove(team);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id:int}/members/{memberId:int}")]
    public async Task<IActionResult> UpdateMember(int id, int memberId, [FromBody] UpdateMemberRequest req)
    {
        var member = await db.TeamMembers
            .Include(m => m.Team)
            .FirstOrDefaultAsync(m => m.Id == memberId && m.PokemonTeamId == id && m.Team!.UserId == UserId);
        if (member is null) return NotFound();

        member.HeldItem  = req.HeldItem;
        member.Ability   = req.Ability;
        member.Nature    = req.Nature;
        member.Move1     = req.Move1;
        member.Move2     = req.Move2;
        member.Move3     = req.Move3;
        member.Move4     = req.Move4;
        member.EvHp      = Math.Clamp(req.EvHp,    0, 252);
        member.EvAtk     = Math.Clamp(req.EvAtk,   0, 252);
        member.EvDef     = Math.Clamp(req.EvDef,   0, 252);
        member.EvSpAtk   = Math.Clamp(req.EvSpAtk, 0, 252);
        member.EvSpDef   = Math.Clamp(req.EvSpDef, 0, 252);
        member.EvSpeed   = Math.Clamp(req.EvSpeed,  0, 252);
        member.IvHp      = Math.Clamp(req.IvHp,    0, 31);
        member.IvAtk     = Math.Clamp(req.IvAtk,   0, 31);
        member.IvDef     = Math.Clamp(req.IvDef,   0, 31);
        member.IvSpAtk   = Math.Clamp(req.IvSpAtk, 0, 31);
        member.IvSpDef   = Math.Clamp(req.IvSpDef, 0, 31);
        member.IvSpeed   = Math.Clamp(req.IvSpeed,  0, 31);

        await db.SaveChangesAsync();
        return Ok(member);
    }

    [HttpDelete("{id:int}/members/{pokemonId:int}")]
    public async Task<IActionResult> RemoveMember(int id, int pokemonId)
    {
        var member = await db.TeamMembers
            .Include(m => m.Team)
            .FirstOrDefaultAsync(m => m.PokemonTeamId == id && m.PokemonId == pokemonId && m.Team!.UserId == UserId);
        if (member is null) return NotFound();
        db.TeamMembers.Remove(member);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
