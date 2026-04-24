namespace PokemonBackend.DTOs;

public record PokemonListResponse(
    int Count,
    string? Next,
    string? Previous,
    List<PokemonListItem> Results
);

public record PokemonListItem(string Name, string Url);

public record PokemonDetail(
    int Id,
    string Name,
    int Height,
    int Weight,
    int BaseExperience,
    List<PokemonType> Types,
    List<PokemonStat> Stats,
    List<PokemonAbility> Abilities,
    PokemonSprites Sprites
);

public record PokemonType(int Slot, TypeInfo Type);
public record TypeInfo(string Name, string Url);
public record PokemonStat(int BaseStat, int Effort, StatInfo Stat);
public record StatInfo(string Name, string Url);
public record PokemonAbility(bool IsHidden, int Slot, AbilityInfo Ability);
public record AbilityInfo(string Name, string Url);
public record PokemonSprites(
    string? FrontDefault,
    string? FrontShiny,
    OfficialArtwork? Other
);
public record OfficialArtwork(OfficialArtworkImages? OfficialArtwork2);
public record OfficialArtworkImages(string? FrontDefault, string? FrontShiny);

public record AddFavoriteRequest(int PokemonId, string PokemonName, string PokemonImageUrl);
public record CreateTeamRequest(string Name);
public record AddTeamMemberRequest(int PokemonId, string PokemonName, string PokemonImageUrl, int Slot);
public record UpdateMemberRequest(
    string? HeldItem, string? Ability, string? Nature,
    string? Move1, string? Move2, string? Move3, string? Move4,
    int EvHp, int EvAtk, int EvDef, int EvSpAtk, int EvSpDef, int EvSpeed,
    int IvHp, int IvAtk, int IvDef, int IvSpAtk, int IvSpDef, int IvSpeed);
