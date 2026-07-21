using RedPandaApi.Models;

namespace RedPandaApi.Services;

// Classic SM-2 algorithm (used by Anki's ancestor SuperMemo).
// quality: 0-5, where < 3 means "failed / not remembered".
public static class SpacedRepetitionService
{
    public static void ApplyReview(Card card, int quality)
    {
        quality = Math.Clamp(quality, 0, 5);

        if (quality < 3)
        {
            // Forgot it -> reset repetitions, review again soon (tomorrow)
            card.Repetitions = 0;
            card.IntervalDays = 1;
            card.WrongCount += 1;
        }
        else
        {
            card.CorrectCount += 1;

            if (card.Repetitions == 0)
            {
                card.IntervalDays = 1;
            }
            else if (card.Repetitions == 1)
            {
                card.IntervalDays = 6;
            }
            else
            {
                card.IntervalDays = (int)Math.Round(card.IntervalDays * card.EaseFactor);
            }

            card.Repetitions += 1;
        }

        // Update ease factor (never goes below 1.3)
        var newEase = card.EaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        card.EaseFactor = Math.Max(1.3, newEase);

        card.LastReviewedDate = DateTime.UtcNow;
        card.NextReviewDate = DateTime.UtcNow.AddDays(card.IntervalDays);
    }

    // Convenience: derive a quality score from the simple 2-button UI
    // ("จำได้แล้ว" / "ยังไม่ได้") used in the flashcard screen.
    public static int QualityFromRemembered(bool remembered) => remembered ? 4 : 1;

    public static bool IsRemembered(int quality) {
        return quality >= 3;
    }


}
