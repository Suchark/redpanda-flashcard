using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using RedPandaApi.Models;
using RedPandaApi.Services;

namespace RedPandaApi.Controllers;

[ApiController]
[Route("api/cards")]
public class CardsController : ControllerBase
{
    private readonly MongoDbService _db;
    private readonly DictionaryService _dictionary;

    public CardsController(MongoDbService db, DictionaryService dictionary)
    {
        _db = db;
        _dictionary = dictionary;
    }

    [HttpGet]
    public async Task<ActionResult<List<Card>>> GetAll([FromQuery] string? deckId, [FromQuery] string? tag)
    {
        var filterBuilder = Builders<Card>.Filter;
        var filter = filterBuilder.Empty;

        if (!string.IsNullOrEmpty(deckId))
            filter &= filterBuilder.Eq(c => c.DeckId, deckId);

        if (!string.IsNullOrEmpty(tag))
            filter &= filterBuilder.AnyEq(c => c.Tags, tag);

        var cards = await _db.Cards.Find(filter).SortByDescending(c => c.CreatedAt).ToListAsync();
        return Ok(cards);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Card>> GetById(string id)
    {
        var card = await _db.Cards.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (card == null) return NotFound();
        return Ok(card);
    }

    // GET /api/cards/lookup?word=abandon  -> calls free dictionary + translation API (no save)
    [HttpGet("lookup")]
    public async Task<ActionResult<LookupResult>> Lookup([FromQuery] string word)
    {
        if (string.IsNullOrWhiteSpace(word)) return BadRequest("word is required");
        var result = await _dictionary.LookupAsync(word.Trim());
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Card>> Create(Card card)
    {
        card.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        card.CreatedAt = DateTime.UtcNow;
        card.NextReviewDate = DateTime.UtcNow; // due immediately for first study
        await _db.Cards.InsertOneAsync(card);
        return CreatedAtAction(nameof(GetById), new { id = card.Id }, card);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Card updated)
    {
        updated.Id = id;
        var result = await _db.Cards.ReplaceOneAsync(c => c.Id == id, updated);
        if (result.MatchedCount == 0) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var result = await _db.Cards.DeleteOneAsync(c => c.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }
}
