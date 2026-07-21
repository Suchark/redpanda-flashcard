using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using RedPandaApi.Models;
using RedPandaApi.Services;

namespace RedPandaApi.Controllers;

[ApiController]
[Route("api/stats")]
public class StatsController : ControllerBase
{
    private readonly MongoDbService _db;

    public StatsController(MongoDbService db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<Stats>> Get()
    {
        var stats = await _db.Stats.Find(_ => true).FirstOrDefaultAsync();
        if (stats == null)
        {
            stats = new Stats();
            await _db.Stats.InsertOneAsync(stats);
        }
        return Ok(stats);
    }

    public class UnlockRequest
    {
        public string OutfitId { get; set; } = string.Empty;
        public int Cost { get; set; } = 1; // in leaves
    }

    [HttpPost("unlock-outfit")]
    public async Task<ActionResult<Stats>> UnlockOutfit(UnlockRequest req)
    {
        var stats = await _db.Stats.Find(_ => true).FirstOrDefaultAsync();
        if (stats == null) return NotFound();

        if (stats.UnlockedOutfits.Contains(req.OutfitId))
            return BadRequest("already unlocked");

        if (stats.Leaves < req.Cost)
            return BadRequest("not enough leaves");

        stats.Leaves -= req.Cost;
        stats.UnlockedOutfits.Add(req.OutfitId);

        await _db.Stats.ReplaceOneAsync(s => s.Id == stats.Id, stats);
        return Ok(stats);
    }

    public class EquipRequest
    {
        public string OutfitId { get; set; } = string.Empty;
    }

    [HttpPost("equip-outfit")]
    public async Task<ActionResult<Stats>> EquipOutfit(EquipRequest req)
    {
        var stats = await _db.Stats.Find(_ => true).FirstOrDefaultAsync();
        if (stats == null) return NotFound();

        if (!stats.UnlockedOutfits.Contains(req.OutfitId))
            return BadRequest("outfit not unlocked");

        stats.CurrentOutfit = req.OutfitId;
        await _db.Stats.ReplaceOneAsync(s => s.Id == stats.Id, stats);
        return Ok(stats);
    }
}
