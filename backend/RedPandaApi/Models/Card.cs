using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RedPandaApi.Models;

public class Card {
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonRepresentation(BsonType.ObjectId)]
    public string DeckId { get; set; } = string.Empty;

    public string Word { get; set; } = string.Empty;
    public string PartOfSpeech { get; set; } = string.Empty;   // noun, verb, ...
    public string Phonetic { get; set; } = string.Empty;
    public string MeaningEn { get; set; } = string.Empty;
    public string MeaningTh { get; set; } = string.Empty;
    public string ExampleSentence { get; set; } = string.Empty;
    public string OriginalSentence { get; set; } = string.Empty; // from source text, optional
    public List<string> RelatedWords { get; set; } = new();
    public List<string> Tags { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ---- Spaced Repetition (SM-2) fields ----
    public double EaseFactor { get; set; } = 2.5;
    public int IntervalDays { get; set; } = 0;
    public int Repetitions { get; set; } = 0;
    public DateTime NextReviewDate { get; set; } = DateTime.UtcNow;
    public DateTime? LastReviewedDate { get; set; } = null;
    public int CorrectCount { get; set; } = 0;
    public int WrongCount { get; set; } = 0;

    // ---- Mastered / Archive ----
    // When true, the card is excluded from the Daily Review (due) and Weakness
    // queues. It still shows up in the deck's full word list and in Cram mode,
    // and can be un-archived manually. Archiving/un-archiving never touches
    // CorrectCount/WrongCount or the SM-2 scheduling fields.
    public bool IsArchived { get; set; } = false;
}