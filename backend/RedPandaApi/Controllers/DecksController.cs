using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using RedPandaApi.Models;
using RedPandaApi.Services;

namespace RedPandaApi.Controllers;

[ApiController]
[Route("api/decks")]
public class DecksController : ControllerBase
{
    private readonly MongoDbService _db;

    public DecksController(MongoDbService db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<Deck>>> GetAll()
    {
        var decks = await _db.Decks.Find(_ => true).SortByDescending(d => d.CreatedAt).ToListAsync();
        return Ok(decks);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Deck>> GetById(string id)
    {
        var deck = await _db.Decks.Find(d => d.Id == id).FirstOrDefaultAsync();
        if (deck == null) return NotFound();
        return Ok(deck);
    }

    [HttpPost]
    public async Task<ActionResult<Deck>> Create(Deck deck)
    {
        deck.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        deck.CreatedAt = DateTime.UtcNow;
        await _db.Decks.InsertOneAsync(deck);
        return CreatedAtAction(nameof(GetById), new { id = deck.Id }, deck);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Deck updated)
    {
        var result = await _db.Decks.ReplaceOneAsync(d => d.Id == id, updated);
        if (result.MatchedCount == 0) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        // Also remove all cards belonging to this deck
        await _db.Cards.DeleteManyAsync(c => c.DeckId == id);
        var result = await _db.Decks.DeleteOneAsync(d => d.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }
}
