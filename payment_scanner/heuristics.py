"""Module for identifying suspicious payment-related HTML/JS patterns."""

import logging
import re
from typing import List
from payment_scanner.utils import ParsedPage, SuspiciousFinding

logger = logging.getLogger(__name__)

# Regex for IPv4 in URLs
IP_ACTION_REGEX = re.compile(
    r"^https?://(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]+)?(?:/.*)?$",
    re.IGNORECASE,
)

# Common payment-related keywords in form input names or IDs
PAYMENT_INPUT_KEYWORDS = {
    "card",
    "cvv",
    "cvc",
    "expiry",
    "expiration",
    "ccname",
    "ccnumber",
    "pan",
    "cardnumber",
    "card_number",
    "card-number",
}


def detect_heuristics(parsed_page: ParsedPage) -> List[SuspiciousFinding]:
    """Scans the parsed page structure for suspicious patterns.

    Args:
        parsed_page: The ParsedPage instance containing extracted page elements.

    Returns:
        A list of SuspiciousFinding objects.
    """
    findings: List[SuspiciousFinding] = []

    # 1. Raw IP Form Action
    for form in parsed_page.forms:
        if form.action and IP_ACTION_REGEX.match(form.action.strip()):
            description = "Form posts directly to an IP address."
            details = f"Action: {form.action}"
            findings.append(
                SuspiciousFinding(
                    pattern_type="Raw IP Form Action",
                    description=description,
                    details=details,
                )
            )
            logger.warning("Suspicious finding: %s (%s)", description, details)

    # 2. Missing Form Action on payment-related fields
    for form in parsed_page.forms:
        # Check if the action is empty or missing
        action_strip = form.action.strip() if form.action else ""
        if not action_strip or action_strip == "#":
            # Check if this form contains credit card or payment sensitive inputs
            has_payment_inputs = False
            matched_inputs = []

            for input_field in form.input_names + form.input_ids:
                field_lower = input_field.lower()
                for keyword in PAYMENT_INPUT_KEYWORDS:
                    if keyword in field_lower:
                        has_payment_inputs = True
                        matched_inputs.append(input_field)
                        break

            if has_payment_inputs:
                description = "Missing form action on a potential payment form."
                details = (
                    f"Form action is '{form.action}' but form contains payment "
                    f"inputs: {', '.join(matched_inputs)}"
                )
                findings.append(
                    SuspiciousFinding(
                        pattern_type="Missing Form Action",
                        description=description,
                        details=details,
                    )
                )
                logger.warning(
                    "Suspicious finding: %s (%s)", description, details
                )

    # 3. JavaScript rewriting form action
    for rewrite in parsed_page.js_rewrite_patterns:
        description = "JavaScript rewriting form action detected."
        details = f"Matched pattern: {rewrite}"
        findings.append(
            SuspiciousFinding(
                pattern_type="JS Action Rewrite",
                description=description,
                details=details,
            )
        )
        logger.warning("Suspicious finding: %s (%s)", description, details)

    # 4. Hidden iframes
    for iframe in parsed_page.hidden_iframes:
        description = "Hidden iframe detected."
        details = f"HTML: {iframe}"
        findings.append(
            SuspiciousFinding(
                pattern_type="Hidden Iframe",
                description=description,
                details=details,
            )
        )
        logger.warning("Suspicious finding: %s (%s)", description, details)

    return findings
