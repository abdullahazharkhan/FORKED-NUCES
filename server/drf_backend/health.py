import logging
import secrets

from django.core.cache import cache
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from accounts.models import User


logger = logging.getLogger(__name__)


@require_GET
def health(request):
    """Process liveness; intentionally avoids external dependencies."""

    return JsonResponse({"status": "ok"})


@require_GET
def readiness(request):
    """Verify that the database and shared cache can serve requests."""

    checks = {"database": "ok", "cache": "ok"}
    try:
        User.objects.values_list("user_id", flat=True).first()
    except Exception:
        checks["database"] = "error"
        logger.exception("Readiness database check failed")

    cache_key = f"readiness:{secrets.token_hex(8)}"
    cache_value = secrets.token_hex(8)
    try:
        cache.set(cache_key, cache_value, timeout=5)
        if cache.get(cache_key) != cache_value:
            raise RuntimeError("Cache round-trip returned an unexpected value")
        cache.delete(cache_key)
    except Exception:
        checks["cache"] = "error"
        logger.exception("Readiness cache check failed")

    ready = all(value == "ok" for value in checks.values())
    return JsonResponse(
        {"status": "ok" if ready else "unavailable", "checks": checks},
        status=200 if ready else 503,
    )
