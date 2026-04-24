using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PokemonBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddFinishedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FinishedAt",
                table: "GameProgresses",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FinishedAt",
                table: "GameProgresses");
        }
    }
}
