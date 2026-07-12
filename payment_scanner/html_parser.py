"""Module for extracting elements and content from HTML using BeautifulSoup."""

import logging
import re
from typing import List
from bs4 import BeautifulSoup, Comment
from payment_scanner.utils import ParsedPage, ParsedForm

logger = logging.getLogger(__name__)


def parse_html(html_content: bytes, url: str) -> ParsedPage:
    """Parses raw HTML bytes and extracts key elements for gateway and heuristic analysis.

    Args:
        html_content: Raw HTML content as bytes.
        url: The source URL or file path.

    Returns:
        A ParsedPage dataclass containing extracted structure and content.
    """
    logger.info("Parsing HTML content using BeautifulSoup")
    soup = BeautifulSoup(html_content, "html.parser")

    # Count total DOM elements for scanning statistics
    all_elements = soup.find_all(True)
    num_elements = len(all_elements)

    # Extract Scripts
    script_srcs: List[str] = []
    inline_scripts: List[str] = []
    all_scripts = soup.find_all("script")
    for script in all_scripts:
        src = script.get("src")
        if src:
            script_srcs.append(src)
        if script.string:
            inline_scripts.append(script.string)

    # Extract Forms
    forms: List[ParsedForm] = []
    all_forms = soup.find_all("form")
    for form in all_forms:
        action = form.get("action", "")
        method = form.get("method", "get").lower()
        input_names: List[str] = []
        input_ids: List[str] = []
        input_types: List[str] = []

        for inp in form.find_all("input"):
            name = inp.get("name")
            if name:
                input_names.append(name)
            inp_id = inp.get("id")
            if inp_id:
                input_ids.append(inp_id)
            inp_type = inp.get("type", "text").lower()
            input_types.append(inp_type)

        forms.append(
            ParsedForm(
                action=action,
                method=method,
                input_names=input_names,
                input_ids=input_ids,
                input_types=input_types,
            )
        )

    # Optimize extraction of element IDs and classes via targeted queries
    element_ids: List[str] = []
    for tag in soup.find_all(id=True):
        tag_id = tag.get("id")
        if isinstance(tag_id, list):
            element_ids.extend(tag_id)
        else:
            element_ids.append(tag_id)

    element_classes: List[str] = []
    for tag in soup.find_all(class_=True):
        tag_class = tag.get("class")
        if isinstance(tag_class, list):
            element_classes.extend(tag_class)
        else:
            element_classes.append(tag_class)

    # Known-safe iframe hosts – analytics/tag managers used on legitimate sites.
    # These should never be flagged as suspicious hidden iframes.
    SAFE_IFRAME_HOSTS = {
        "googletagmanager.com",
        "www.googletagmanager.com",
        "google.com",
        "www.google.com",
        "analytics.google.com",
        "doubleclick.net",
        "facebook.com",
        "www.facebook.com",
        "connect.facebook.net",
        "twitter.com",
        "platform.twitter.com",
        "linkedin.com",
        "www.linkedin.com",
        "hotjar.com",
        "snap.licdn.com",
        "bid.g.doubleclick.net",
    }

    # Extract & detect hidden iframes
    hidden_iframes: List[str] = []
    for tag in soup.find_all("iframe"):
        style = tag.get("style", "").lower()
        is_hidden = (
            tag.has_attr("hidden")
            or "display:none" in style.replace(" ", "")
            or "visibility:hidden" in style.replace(" ", "")
        )
        if is_hidden:
            iframe_src = tag.get("src", "")
            # Skip known-safe analytics/tag manager iframes
            if iframe_src:
                from urllib.parse import urlparse as _urlparse
                iframe_host = _urlparse(iframe_src).netloc.lower().lstrip("www.")
                if any(
                    iframe_src.lower().startswith(f"https://{safe}") or
                    iframe_src.lower().startswith(f"http://{safe}")
                    for safe in SAFE_IFRAME_HOSTS
                ) or iframe_host in SAFE_IFRAME_HOSTS:
                    logger.debug("Skipping known-safe analytics iframe: %s", iframe_src)
                    continue
            iframe_id = tag.get("id", "")
            iframe_class = " ".join(tag.get("class", [])) if tag.get("class") else ""
            repr_str = f"<iframe id='{iframe_id}' class='{iframe_class}' src='{iframe_src}'>"
            hidden_iframes.append(repr_str)

    # Detect JavaScript rewriting form action
    js_rewrite_patterns: List[str] = []
    rewrite_regexes = [
        re.compile(r"\.action\s*="),
        re.compile(r"setAttribute\(\s*['\"]action['\"]\s*,"),
        re.compile(r"document\.forms\[.*\]\.action"),
    ]

    for script_content in inline_scripts:
        for regex in rewrite_regexes:
            matches = regex.findall(script_content)
            if matches:
                for match in matches:
                    js_rewrite_patterns.append(match)

    # Extract visible page text
    # Exclude style, script, head, title, meta, [document] and comments
    for element in soup(["style", "script", "head", "title", "meta", "[document]"]):
        element.decompose()

    # Retrieve all comments and remove them as well to ensure clean text extraction
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()

    visible_text = soup.get_text(separator=" ")

    # Generate one lowercased searchable text blob consisting of:
    # - visible page text
    # - inline JavaScript
    text_blob_elements = [visible_text] + inline_scripts
    searchable_text = " ".join(text_blob_elements).lower()

    # Create ParsedPage and attach element/script/form counts as attributes or log them
    parsed_page = ParsedPage(
        url=url,
        script_srcs=script_srcs,
        inline_scripts=inline_scripts,
        forms=forms,
        element_ids=element_ids,
        element_classes=element_classes,
        searchable_text=searchable_text,
        hidden_iframes=hidden_iframes,
        js_rewrite_patterns=js_rewrite_patterns,
    )
    # Store counts dynamically on the object for statistics extraction later
    parsed_page.num_scripts = len(all_scripts)
    parsed_page.num_forms = len(all_forms)
    parsed_page.num_elements = num_elements

    return parsed_page


