from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self) -> User:
        user = User()
        self.db.add(user)
        self.db.flush()
        return user

    def get(self, user_id: uuid.UUID) -> User | None:
        return self.db.get(User, user_id)

    def ensure_exists(self, user_id: uuid.UUID) -> User | None:
        return self.get(user_id)
