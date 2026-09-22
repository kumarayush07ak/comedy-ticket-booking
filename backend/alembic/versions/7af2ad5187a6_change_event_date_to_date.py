"""change event date to date

Revision ID: 7af2ad5187a6
Revises: 9b935a2552fb
Create Date: 2026-09-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "7af2ad5187a6"
down_revision: Union[str, Sequence[str], None] = "9b935a2552fb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "events",
        "event_date",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        type_=sa.Date(),
        existing_nullable=False,
        postgresql_using="event_date::date",
    )


def downgrade() -> None:
    op.alter_column(
        "events",
        "event_date",
        existing_type=sa.Date(),
        type_=postgresql.TIMESTAMP(timezone=True),
        existing_nullable=False,
        postgresql_using="event_date::timestamp",
    )