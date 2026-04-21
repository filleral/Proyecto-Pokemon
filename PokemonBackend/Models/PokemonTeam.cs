namespace PokemonBackend.Models;

public class PokemonTeam
{
    public int Id { get; set; }
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
}
