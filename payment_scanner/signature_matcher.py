"""Module for matching extracted HTML elements against payment gateway signatures."""

import json
import logging
import re
from pathlib import Path
from typing import Dict, Any, List
from payment_scanner.utils import ParsedPage, GatewayMatch, WEIGHTS

logger = logging.getLogger(__name__)


class SignatureLoadError(Exception):
    """Exception raised when signatures fail to load."""


def load_signatures(path: str) -> Dict[str, Any]:
    """Loads gateway signatures from a JSON file.

    Args:
        path: Path to the JSON signatures file.

    Returns:
        A dictionary containing signatures.

    Raises:
        SignatureLoadError: If file loading or parsing fails.
    """
    try:
        sig_path = Path(path)
        if not sig_path.exists():
            raise SignatureLoadError(f"Signatures file not found at: {path}")
        with open(sig_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        error_msg = f"Invalid JSON in signatures file {path}: {e}"
        logger.error(error_msg)
        raise SignatureLoadError(error_msg) from e
    except Exception as e:
        error_msg = f"Failed to load signatures from {path}: {e}"
        logger.error(error_msg)
        raise SignatureLoadError(error_msg) from e


_REGEX_CACHE: Dict[str, re.Pattern] = {}


def get_compiled_regex(pattern: str) -> re.Pattern:
    """Retrieves or compiles a regular expression pattern with IGNORECASE flags.

    Args:
        pattern: The regular expression pattern string.

    Returns:
        The compiled re.Pattern object.
    """
    if pattern not in _REGEX_CACHE:
        _REGEX_CACHE[pattern] = re.compile(pattern, re.IGNORECASE)
    return _REGEX_CACHE[pattern]


def match_signatures(
    parsed_page: ParsedPage, signatures: Dict[str, Any]
) -> List[GatewayMatch]:
    """Matches a parsed page against gateway signatures and computes confidence.

    Args:
        parsed_page: The ParsedPage instance.
        signatures: Dict containing the signature definitions.

    Returns:
        A list of GatewayMatch objects containing matching gateways.
    """
    matches: List[GatewayMatch] = []

    for gateway, sigs in signatures.items():
        logger.debug("Checking signatures for gateway: %s", gateway)
        score = 0
        reasons: List[str] = []

        script_patterns = sigs.get("script_patterns", [])
        keywords = sigs.get("keywords", [])
        form_action_patterns = sigs.get("form_action_patterns", [])
        button_ids = sigs.get("button_ids", [])

        # 1. Script source match – deduplicate to avoid double-scoring the same URL
        script_matched = False
        matched_script_srcs_set: set = set()
        for pattern in script_patterns:
            compiled = get_compiled_regex(pattern)
            for src in parsed_page.script_srcs:
                if compiled.search(src):
                    matched_script_srcs_set.add(src)

        matched_script_srcs = sorted(matched_script_srcs_set)
        if matched_script_srcs:
            script_matched = True
            score += WEIGHTS["script"]
            for src in matched_script_srcs:
                reasons.append(f"Script matched: {src}")
            logger.debug(
                "[%s] Script matched (score +%d)", gateway, WEIGHTS["script"]
            )

        # 2. Form action match
        form_action_matched = False
        matched_actions = []
        for pattern in form_action_patterns:
            compiled = get_compiled_regex(pattern)
            for form in parsed_page.forms:
                if compiled.search(form.action):
                    form_action_matched = True
                    matched_actions.append(form.action)


        if form_action_matched:
            score += WEIGHTS["form_action"]
            for act in matched_actions:
                reasons.append(f"Form action matched: {act}")
            logger.debug(
                "[%s] Form action matched (score +%d)",
                gateway,
                WEIGHTS["form_action"],
            )

        # 3. Button ID match
        button_matched = False
        matched_ids = []
        for btn_id in button_ids:
            # Match strictly as a string or regex if needed, but exact checks are safest.
            # We will use case-insensitive exact match first, and check in parsed element_ids.
            for element_id in parsed_page.element_ids:
                if btn_id.lower() == element_id.lower():
                    button_matched = True
                    matched_ids.append(element_id)

        if button_matched:
            score += WEIGHTS["button_id"]
            for bid in matched_ids:
                reasons.append(f"Button ID matched: {bid}")
            logger.debug(
                "[%s] Button ID matched (score +%d)",
                gateway,
                WEIGHTS["button_id"],
            )

        # 4. Keyword match
        keyword_matched = False
        matched_keywords = []
        for kw in keywords:
            # Case insensitive search on the lowercased searchable text
            if kw.lower() in parsed_page.searchable_text:
                keyword_matched = True
                matched_keywords.append(kw)

        if keyword_matched:
            score += WEIGHTS["keyword"]
            for kw in matched_keywords:
                reasons.append(f"Keyword matched: {kw}")
            logger.debug(
                "[%s] Keyword matched (score +%d)", gateway, WEIGHTS["keyword"]
            )

        # Determine if we have any non-keyword matches (script, form_action, button_id)
        has_non_keyword_match = script_matched or form_action_matched or button_matched

        # If score is solely from keyword matches, treat as no match
        if score > 0 and not has_non_keyword_match:
            score = 0
            reasons = []  # Clear reason since we disregard keyword-only matches

        # Resolve confidence level
        if score >= 80:
            confidence = "High"
        elif score >= 40:
            confidence = "Medium"
        elif score >= 20:
            confidence = "Low"
        else:
            confidence = "None"

        if confidence != "None":
            matches.append(
                GatewayMatch(
                    name=gateway,
                    confidence=confidence,
                    score=score,
                    reasons=reasons,
                )
            )

    return matches
