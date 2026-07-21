using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RedPandaApi.Models;

// Single-user app -> we just keep one Stats document.
public class Stats
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public int StreakDays { get; set; } = 0;
    public DateTime? LastStudyDateUtc { get; set; } = null;

    public int TotalPoints { get; set; } = 0;
    public int Leaves { get; set; } = 0; // "ใบไม้ทองคำ" currency for unlocking outfits

    public List<string> UnlockedOutfits { get; set; } = new() { "default" };
    public string CurrentOutfit { get; set; } = "default";

    public int TotalCardsLearned { get; set; } = 0;
}
