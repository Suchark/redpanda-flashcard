namespace RedPandaApi.Models;

public class ReviewRequest
{
    public string CardId { get; set; } = string.Empty;
    // true = "จำได้แล้ว" (remembered), false = "ยังไม่ได้" (not yet)
    public bool Remembered { get; set; }
    // optional finer grain: 0-5 quality like classic SM-2 (if not sent, derived from Remembered)
    public int? Quality { get; set; }
}

public class LookupResult
{
    public string Word { get; set; } = string.Empty;
    public string PartOfSpeech { get; set; } = string.Empty;
    public string Phonetic { get; set; } = string.Empty;
    public string MeaningEn { get; set; } = string.Empty;
    public string MeaningTh { get; set; } = string.Empty;
    public string ExampleSentence { get; set; } = string.Empty;
    public List<string> RelatedWords { get; set; } = new();
    public bool Found { get; set; } = true;
    public string? Error { get; set; }
}
