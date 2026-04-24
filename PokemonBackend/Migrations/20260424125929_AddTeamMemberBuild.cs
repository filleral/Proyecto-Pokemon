using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PokemonBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamMemberBuild : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Ability",
                table: "TeamMembers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EvAtk",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EvDef",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EvHp",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EvSpAtk",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EvSpDef",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EvSpeed",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "HeldItem",
                table: "TeamMembers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IvAtk",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "IvDef",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "IvHp",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "IvSpAtk",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "IvSpDef",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "IvSpeed",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Move1",
                table: "TeamMembers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Move2",
                table: "TeamMembers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Move3",
                table: "TeamMembers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Move4",
                table: "TeamMembers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Nature",
                table: "TeamMembers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Ability",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "EvAtk",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "EvDef",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "EvHp",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "EvSpAtk",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "EvSpDef",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "EvSpeed",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "HeldItem",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "IvAtk",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "IvDef",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "IvHp",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "IvSpAtk",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "IvSpDef",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "IvSpeed",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "Move1",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "Move2",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "Move3",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "Move4",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "Nature",
                table: "TeamMembers");
        }
    }
}
