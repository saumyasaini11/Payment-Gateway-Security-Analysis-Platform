"""Module for retrieving HTML content from remote URLs or local files."""

import logging
from pathlib import Path
from typing import Optional
import requests
from payment_scanner.utils import DEFAULT_TIMEOUT, DEFAULT_USER_AGENT

logger = logging.getLogger(__name__)


class FetcherError(Exception):
    """Base exception for all fetcher errors."""


def fetch_content(
    source: str,
    is_file: bool = False,
    timeout: int = DEFAULT_TIMEOUT,
    user_agent: str = DEFAULT_USER_AGENT,
) -> Optional[bytes]:
    """Retrieves HTML content from a URL or local file path as raw bytes.

    Args:
        source: The URL or path to a local file.
        is_file: Boolean flag indicating if source is a file path.
        timeout: HTTP request timeout in seconds.
        user_agent: User-Agent header value for HTTP requests.

    Returns:
        The HTML content bytes if retrieval succeeds, or None if it fails.

    Raises:
        FetcherError: If fetching fails due to network, file, or SSL issues.
    """
    if is_file:
        logger.info("Reading local file: %s", source)
        try:
            path = Path(source)
            if not path.is_file():
                error_msg = f"File not found: {source}"
                logger.error(error_msg)
                raise FetcherError(error_msg)
            return path.read_bytes()
        except Exception as e:
            error_msg = f"Failed to read local file: {e}"
            logger.error(error_msg)
            raise FetcherError(error_msg) from e

    logger.info("Fetching remote URL: %s", source)
    headers = {"User-Agent": user_agent}
    try:
        response = requests.get(
            source, headers=headers, timeout=timeout, allow_redirects=True
        )
        response.raise_for_status()
        return response.content
    except requests.exceptions.Timeout as e:
        error_msg = f"Timeout error fetching URL {source}: {e}"
        logger.error(error_msg)
        raise FetcherError(error_msg) from e
    except requests.exceptions.SSLError as e:
        error_msg = f"SSL error fetching URL {source}: {e}"
        logger.error(error_msg)
        raise FetcherError(error_msg) from e
    except requests.exceptions.ConnectionError as e:
        error_msg = f"Connection/DNS error fetching URL {source}: {e}"
        logger.error(error_msg)
        raise FetcherError(error_msg) from e
    except requests.exceptions.HTTPError as e:
        error_msg = f"HTTP error {response.status_code} fetching URL {source}: {e}"
        logger.error(error_msg)
        raise FetcherError(error_msg) from e
    except requests.exceptions.RequestException as e:
        error_msg = f"Network exception fetching URL {source}: {e}"
        logger.error(error_msg)
        raise FetcherError(error_msg) from e

