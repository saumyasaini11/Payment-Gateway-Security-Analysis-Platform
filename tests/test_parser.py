"""Unit tests for html_parser.py."""

from payment_scanner.html_parser import parse_html


def test_html_parser_basic() -> None:
    """Tests basic parsing capabilities of parse_html."""
    html = """
    <html>
        <head>
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </head>
        <body>
            <form id="pay-form" action="/submit" method="POST">
                <input type="text" name="username" id="user_id">
                <input type="password" name="pwd">
            </form>
            <div class="btn-container active">
                <button id="rzp-button">Pay</button>
            </div>
            <script>
                console.log("inline script content");
            </script>
        </body>
    </html>
    """
    parsed = parse_html(html.encode("utf-8"), "test_url")

    # Assert scripts
    assert "https://checkout.razorpay.com/v1/checkout.js" in parsed.script_srcs
    assert any("inline script content" in s for s in parsed.inline_scripts)

    # Assert forms
    assert len(parsed.forms) == 1
    form = parsed.forms[0]
    assert form.action == "/submit"
    assert form.method == "post"
    assert "username" in form.input_names
    assert "pwd" in form.input_names
    assert "user_id" in form.input_ids

    # Assert elements
    assert "pay-form" in parsed.element_ids
    assert "rzp-button" in parsed.element_ids
    assert "btn-container" in parsed.element_classes
    assert "active" in parsed.element_classes

    # Assert text blob
    assert "pay" in parsed.searchable_text
    assert "inline script content" in parsed.searchable_text
