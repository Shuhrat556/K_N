from hmac import compare_digest

from fastapi import Depends, Header, HTTPException, status

from app.core.config import Settings, get_settings


def require_admin_key(
    x_admin_key: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> None:
    expected = settings.admin_api_key.strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Админ API отключён: задайте ADMIN_API_KEY в окружении.",
        )

    bearer = ""
    if authorization and authorization.lower().startswith("bearer "):
        bearer = authorization[len("bearer ") :].strip()

    provided = (x_admin_key or "").strip() or bearer
    if not provided:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Введите ключ администратора.",
        )

    if not compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный ключ администратора.",
        )
