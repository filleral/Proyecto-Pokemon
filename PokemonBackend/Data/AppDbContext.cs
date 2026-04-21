using Microsoft.EntityFrameworkCore;
using PokemonBackend.Models;

namespace PokemonBackend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<PokemonTeam> Teams => Set<PokemonTeam>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TeamMember>()
            .HasOne(m => m.Team)
            .WithMany(t => t.Members)
            .HasForeignKey(m => m.PokemonTeamId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
