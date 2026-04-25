using Microsoft.EntityFrameworkCore;
using PokemonBackend.Models;

namespace PokemonBackend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<PokemonTeam> Teams => Set<PokemonTeam>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<GameProgress> GameProgresses => Set<GameProgress>();
    public DbSet<CaughtPokemon> CaughtPokemons => Set<CaughtPokemon>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── Roles seed ────────────────────────────────────────────────────────
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "free",    Description = "Plan gratuito" },
            new Role { Id = 2, Name = "premium", Description = "Plan premium $1/mes" },
            new Role { Id = 3, Name = "admin",   Description = "Administrador" }
        );

        // ── User → Role ───────────────────────────────────────────────────────
        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.GoogleId)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // ── Favorites ─────────────────────────────────────────────────────────
        modelBuilder.Entity<Favorite>()
            .HasOne(f => f.User)
            .WithMany(u => u.Favorites)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Favorite>()
            .HasIndex(f => new { f.UserId, f.PokemonId })
            .IsUnique();

        // ── Teams ─────────────────────────────────────────────────────────────
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

        // ── GameProgress ──────────────────────────────────────────────────────
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
