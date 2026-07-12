"""Unit tests for signature_matcher.py."""

from payment_scanner.utils import ParsedPage, ParsedForm
from payment_scanner.signature_matcher import match_signatures


def test_signature_matcher_matches() -> None:
    """Tests gateway matches and confidence scores calculation."""
    signatures = {
        "Razorpay": {
            "script_patterns": ["checkout\\.razorpay\\.com"],
            "keywords": ["razorpay", "rzp-button"],
            "form_action_patterns": ["api\\.razorpay\\.com"],
            "button_ids": ["rzp-button"],
        }
    }

    # Test high confidence match
    page_high = ParsedPage(
        url="test_url",
        script_srcs=["https://checkout.razorpay.com/v1/checkout.js"],
        inline_scripts=[],
        forms=[ParsedForm(action="https://api.razorpay.com/pay")],
        element_ids=["rzp-button"],
        element_classes=[],
        searchable_text="some text with razorpay keyword",
    )
    matches_high = match_signatures(page_high, signatures)
    assert len(matches_high) == 1
    match = matches_high[0]
    assert match.name == "Razorpay"
    assert match.confidence == "High"
    # Score: script(50) + form_action(40) + button_id(25) + keyword(10) = 125
    assert match.score == 125

    # Test medium confidence match
    page_med = ParsedPage(
        url="test_url",
        script_srcs=[],
        inline_scripts=[],
        forms=[ParsedForm(action="https://api.razorpay.com/pay")],
        element_ids=[],
        element_classes=[],
        searchable_text="razorpay payment",
    )
    matches_med = match_signatures(page_med, signatures)
    assert len(matches_med) == 1
    assert matches_med[0].confidence == "Medium"
    assert matches_med[0].score == 50

    # Score: button_id(25) + keyword(10) = 35? Wait, weight of medium is 40-79.
    # Score 35 is Low (1-39). Let's make sure score is 45.
    # If script matches (+50), score is 50 -> Medium.
    page_med_2 = ParsedPage(
        url="test_url",
        script_srcs=["https://checkout.razorpay.com/v1/checkout.js"],
        inline_scripts=[],
        forms=[],
        element_ids=[],
        element_classes=[],
        searchable_text="regular page",
    )
    matches_med_2 = match_signatures(page_med_2, signatures)
    assert len(matches_med_2) == 1
    assert matches_med_2[0].confidence == "Medium"
    assert matches_med_2[0].score == 50
