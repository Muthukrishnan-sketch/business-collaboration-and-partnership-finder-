"""
Extracts latitude/longitude from a Google Maps link, so business owners can
paste a link instead of looking up coordinates manually.

Handles three shapes of link:
- Full desktop URLs (google.com/maps/place/Name/@lat,lng,zoom/...) — parsed
  directly, no network call.
- Short share links (maps.app.goo.gl/..., goo.gl/maps/...) for a *dropped
  pin* — these redirect to a full URL with @lat,lng or a !3d..!4d.. data
  blob, same as above once resolved.
- Short share links for a *verified Google Business Profile listing* —
  these resolve to a URL identified only by a CID (e.g.
  data=!4m2!3m1!1s0x3a53570c9d483667:0x...), with no coordinates anywhere;
  Google looks the pin up client-side in JS. We fall back to geocoding the
  business name + address text, which is still present in the URL path.
"""
import re
from urllib.parse import unquote

import httpx

# Ordered by precision: "!3d..!4d.." is the actual resolved pin; "@lat,lng"
# is just the map viewport's center and can be off by some distance if the
# share link was generated after panning. Check the precise pattern first.
_COORD_PATTERNS = [
    r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)",     # embedded data blob format (most precise)
    r"@(-?\d+\.\d+),(-?\d+\.\d+)",         # .../@13.0827,80.2707,17z
    r"[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)",    # ?q=13.0827,80.2707
    r"[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)",   # ?ll=13.0827,80.2707
]

# A real browser User-Agent — Google's short-link redirect behavior can
# differ for requests that look like bots/scripts.
_MAPS_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}

# Nominatim's usage policy requires a real, identifying User-Agent (not a
# browser UA) — this is a free geocoder with no API key, appropriate for
# the light, occasional traffic of an admin "add a business" form.
# Policy: https://operations.osmfoundation.org/policies/nominatim/
_NOMINATIM_HEADERS = {"User-Agent": "Threadwork-B2B-App/1.0 (contact: YOUR_EMAIL@example.com)"}


def _find_coords(text: str) -> tuple[float, float] | None:
    for pattern in _COORD_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return float(match.group(1)), float(match.group(2))
    return None


def _extract_place_text(url: str) -> str | None:
    """
    Pulls the human-readable "Name, Address" out of a .../maps/place/<text>/...
    URL. This is what's left to geocode when a short link resolves to a
    CID-only URL with no literal coordinates in it anywhere.
    """
    match = re.search(r"/maps/place/([^/@]+)", url)
    if not match:
        return None
    return unquote(match.group(1)).replace("+", " ")


def _geocode_address(address: str) -> tuple[float, float] | None:
    """Free fallback geocoder, no API key required."""
    try:
        with httpx.Client(timeout=10, headers=_NOMINATIM_HEADERS) as client:
            response = client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": address, "format": "json", "limit": 1},
            )
            results = response.json()
            if results:
                return float(results[0]["lat"]), float(results[0]["lon"])
    except (httpx.HTTPError, ValueError, KeyError, IndexError):
        pass
    return None


def extract_lat_lng_from_google_maps_url(url: str) -> tuple[float, float]:
    # First, try the URL as given — full desktop URLs already have coordinates.
    found = _find_coords(url)
    if found:
        return found

    if "goo.gl" in url:
        try:
            with httpx.Client(follow_redirects=True, timeout=10, headers=_MAPS_HEADERS) as client:
                response = client.get(url)

                # Check the final resolved URL first (works for dropped-pin
                # links, which redirect to a URL with @lat,lng or !3d/!4d).
                resolved_url = str(response.url)
                found = _find_coords(resolved_url)
                if found:
                    return found

                # Some short links land on an interstitial whose visible URL
                # has no coordinates, but they're embedded in the page HTML
                # (canonical/og:url meta tags, inline data). Scan that too.
                found = _find_coords(response.text)
                if found:
                    return found

                # Verified Business Profile listings resolve to a CID-only
                # URL (data=!4m2!3m1!1s0x...:0x...) with no coordinates
                # anywhere in the response — Google renders those client-side
                # in JS. Geocode the readable name+address text instead.
                place_text = _extract_place_text(resolved_url)
                if place_text:
                    found = _geocode_address(place_text)
                    if found:
                        return found
        except httpx.HTTPError:
            pass

    raise ValueError(
        "Could not find coordinates in that Google Maps link. "
        "Try copying the link again from the 'Share' button on the business's map pin, "
        "or enter coordinates manually."
    )