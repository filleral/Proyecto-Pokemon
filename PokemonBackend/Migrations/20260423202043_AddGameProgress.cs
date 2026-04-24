using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PokemonBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddGameProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GameProgresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    GameVersion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrainerName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GameProgresses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CaughtPokemons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GameProgressId = table.Column<int>(type: "int", nullable: false),
                    PokemonId = table.Column<int>(type: "int", nullable: false),
                    PokemonName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CaughtNormal = table.Column<bool>(type: "bit", nullable: false),
                    CaughtShiny = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaughtPokemons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CaughtPokemons_GameProgresses_GameProgressId",
                        column: x => x.GameProgressId,
                        principalTable: "GameProgresses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CaughtPokemons_GameProgressId_PokemonId",
                table: "CaughtPokemons",
                columns: new[] { "GameProgressId", "PokemonId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GameProgresses_UserId",
                table: "GameProgresses",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CaughtPokemons");

            migrationBuilder.DropTable(
                name: "GameProgresses");
        }
    }
}
