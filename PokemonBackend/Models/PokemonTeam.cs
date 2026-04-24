namespace PokemonBackend.Models;

public class PokemonTeam
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<TeamMember> Members { get; set; } = [];
}

public class TeamMember
{
    public int Id { get; set; }
    public int PokemonTeamId { get; set; }
    public PokemonTeam? Team { get; set; }
    public int PokemonId { get; set; }
    public string PokemonName { get; set; } = string.Empty;
    public string PokemonImageUrl { get; set; } = string.Empty;
    public int Slot { get; set; }

    // Build data
    public string? HeldItem { get; set; }
    public string? Ability { get; set; }
    public string? Nature { get; set; }
    public string? Move1 { get; set; }
    public string? Move2 { get; set; }
    public string? Move3 { get; set; }
    public string? Move4 { get; set; }
    public int EvHp { get; set; } = 0;
    public int EvAtk { get; set; } = 0;
    public int EvDef { get; set; } = 0;
    public int EvSpAtk { get; set; } = 0;
    public int EvSpDef { get; set; } = 0;
    public int EvSpeed { get; set; } = 0;
    public int IvHp { get; set; } = 31;
    public int IvAtk { get; set; } = 31;
    public int IvDef { get; set; } = 31;
    public int IvSpAtk { get; set; } = 31;
    public int IvSpDef { get; set; } = 31;
    public int IvSpeed { get; set; } = 31;
}
