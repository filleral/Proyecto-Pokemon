using Microsoft.EntityFrameworkCore;
using PokemonBackend.Models;

namespace PokemonBackend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<PokemonTeam> Teams => Set<PokemonTeam>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<GameProgress> GameProgresses => Set<GameProgress>();
    public DbSet<CaughtPokemon> CaughtPokemons => Set<CaughtPokemon>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.GoogleId)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Favorite>()
            .HasOne(f => f.User)
            .WithMany(u => u.Favorites)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Favorite>()
            .HasIndex(f => new { f.UserId, f.PokemonId })
            .IsUnique();

        modelBuilder.Entity<PokemonTeam>()
            .HasOne(t => t.User)
            .WithMany(u => u.Teams)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TeamMember>()
            .HasOne(m => m.Team)
            .WithMany(t => t.Members)
            .HasForeignKey(m => m.PokemonTeamId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GameProgress>()
            .HasOne(g => g.User)
            .WithMany()
            .HasForeignKey(g => g.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CaughtPokemon>()
            .HasOne(c => c.GameProgress)
            .WithMany(g => g.CaughtPokemons)
            .HasForeignKey(c => c.GameProgressId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CaughtPokemon>()
            .HasIndex(c => new { c.GameProgressId, c.PokemonId })
            .IsUnique();
    }
}
