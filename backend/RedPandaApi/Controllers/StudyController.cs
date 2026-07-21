using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using RedPandaApi.Models;
using RedPandaApi.Services;

namespace RedPandaApi.Controllers;

[ApiController]
[Route("api/study")]
public class StudyController : ControllerBase {
    private readonly MongoDbService _db;
    public StudyController(MongoDbService db) => _db = db;

    // Cards due for review right now (nextReviewDate <= now), optionally scoped to a deck.
    // Archived ("mastered") cards are excluded so the Daily Review queue stays clean.
    [HttpGet("due")]
    public async Task<ActionResult<List<Card>>> GetDue([FromQuery] string? deckId) {
        var filterBuilder = Builders<Card>.Filter;
        var filter = filterBuilder.Lte(c => c.NextReviewDate, DateTime.UtcNow)
                     & filterBuilder.Eq(c => c.IsArchived, false);

        if (!string.IsNullOrEmpty(deckId))
            filter &= filterBuilder.Eq(c => c.DeckId, deckId);

        var cards = await _db.Cards.Find(filter).SortBy(c => c.NextReviewDate).ToListAsync();
        return Ok(cards);
    }

    // "คลังจุดอ่อน" - cards the user gets wrong often (wrongCount > correctCount, or wrongCount >= 2)
    // Archived cards are excluded here too.
    [HttpGet("weakness")]
    public async Task<ActionResult<List<Card>>> GetWeakness([FromQuery] string? deckId) {
        var filterBuilder = Builders<Card>.Filter;
        var filter = filterBuilder.Gte(c => c.WrongCount, 2)
                     & filterBuilder.Eq(c => c.IsArchived, false);

        if (!string.IsNullOrEmpty(deckId))
            filter &= filterBuilder.Eq(c => c.DeckId, deckId);

        var cards = await _db.Cards.Find(filter).SortByDescending(c => c.WrongCount).ToListAsync();
        return Ok(cards);
    }

    // Submit a review result for one card -> applies SM-2, updates streak/points
    [HttpPost("review")]
    public async Task<ActionResult<Card>> SubmitReview(ReviewRequest req) {
        var card = await _db.Cards.Find(c => c.Id == req.CardId).FirstOrDefaultAsync();
        if (card == null) return NotFound("card not found");

        var quality = req.Quality ?? (req.Remembered ? 4 : 1);
        SpacedRepetitionService.ApplyReview(card, quality);

        await _db.Cards.ReplaceOneAsync(c => c.Id == card.Id, card);

        await UpdateStatsAfterReview(SpacedRepetitionService.IsRemembered(quality));

        return Ok(card);
    }

    public class ArchiveRequest {
        public string CardId { get; set; } = string.Empty;
    }

    // Mark a card as "Mastered" -> it disappears from Daily Review / Weakness
    // queues for good, until manually un-archived. Does not touch SM-2 fields
    // or CorrectCount/WrongCount.
    [HttpPost("archive")]
    public async Task<ActionResult<Card>> ArchiveCard(ArchiveRequest req) {
        var card = await _db.Cards.Find(c => c.Id == req.CardId).FirstOrDefaultAsync();
        if (card == null) return NotFound("card not found");

        card.IsArchived = true;
        await _db.Cards.ReplaceOneAsync(c => c.Id == card.Id, card);
        return Ok(card);
    }

    // Bring a mastered card back into normal rotation.
    [HttpPost("unarchive")]
    public async Task<ActionResult<Card>> UnarchiveCard(ArchiveRequest req) {
        var card = await _db.Cards.Find(c => c.Id == req.CardId).FirstOrDefaultAsync();
        if (card == null) return NotFound("card not found");

        card.IsArchived = false;
        await _db.Cards.ReplaceOneAsync(c => c.Id == card.Id, card);
        return Ok(card);
    }

    // List of mastered/archived cards, optionally scoped to a deck, for the
    // "Mastered words" view.
    [HttpGet("archived")]
    public async Task<ActionResult<List<Card>>> GetArchived([FromQuery] string? deckId) {
        var filterBuilder = Builders<Card>.Filter;
        var filter = filterBuilder.Eq(c => c.IsArchived, true);

        if (!string.IsNullOrEmpty(deckId))
            filter &= filterBuilder.Eq(c => c.DeckId, deckId);

        var cards = await _db.Cards.Find(filter).SortByDescending(c => c.CreatedAt).ToListAsync();
        return Ok(cards);
    }

    public class ResetDeckRequest {
        public string DeckId { get; set; } = string.Empty;
    }

    // "Restart Deck" - pulls every (non-mastered) card in the deck back into
    // Daily Review from scratch: resets SM-2 scheduling (ease factor, interval,
    // repetitions, next review date) so everything is due again, but leaves
    // CorrectCount/WrongCount/CreatedAt/points/streak untouched, since those are
    // historical stats, not scheduling state. Mastered cards stay mastered.
    [HttpPost("reset-deck")]
    public async Task<ActionResult> ResetDeck(ResetDeckRequest req) {
        if (string.IsNullOrEmpty(req.DeckId)) return BadRequest("deckId is required");

        var filter = Builders<Card>.Filter.Eq(c => c.DeckId, req.DeckId)
                     & Builders<Card>.Filter.Eq(c => c.IsArchived, false);

        var update = Builders<Card>.Update
            .Set(c => c.EaseFactor, 2.5)
            .Set(c => c.IntervalDays, 0)
            .Set(c => c.Repetitions, 0)
            .Set(c => c.NextReviewDate, DateTime.UtcNow)
            .Set(c => c.LastReviewedDate, (DateTime?)null);

        var result = await _db.Cards.UpdateManyAsync(filter, update);
        return Ok(new { modified = result.ModifiedCount });
    }

    private async Task UpdateStatsAfterReview(bool remembered) {
        var stats = await _db.Stats.Find(_ => true).FirstOrDefaultAsync();
        if (stats == null) {
            stats = new Stats();
            await _db.Stats.InsertOneAsync(stats);
        }

        var todayUtc = DateTime.UtcNow.Date;

        if (stats.LastStudyDateUtc == null) {
            stats.StreakDays = 1;
        } else {
            var lastDate = stats.LastStudyDateUtc.Value.Date;
            if (lastDate == todayUtc) {
                // already studied today, streak unchanged
            } else if (lastDate == todayUtc.AddDays(-1)) {
                stats.StreakDays += 1; // continued streak
            } else {
                stats.StreakDays = 1; // streak broken, restart
            }
        }

        stats.LastStudyDateUtc = DateTime.UtcNow;

        if (remembered) {
            stats.TotalPoints += 10;
            stats.TotalCardsLearned += 1;

            // every 50 points -> 1 golden leaf for unlocking mascot outfits
            if (stats.TotalPoints % 50 == 0)
                stats.Leaves += 1;
        } else {
            stats.TotalPoints += 2; // small consolation points for trying
        }

        await _db.Stats.ReplaceOneAsync(s => s.Id == stats.Id, stats);
    }
}