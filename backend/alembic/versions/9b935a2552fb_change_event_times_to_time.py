"""change event times to time

Revision ID: 9b935a2552fb
Revises: 074703d6323e
Create Date: 2026-09-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "9b935a2552fb"
down_revision: Union[str, Sequence[str], None] = "074703d6323e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "events",
        "start_time",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        type_=sa.Time(),
        existing_nullable=False,
        postgresql_using="start_time::time",
    )

    op.alter_column(
        "events",
        "end_time",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        type_=sa.Time(),
        existing_nullable=False,
        postgresql_using="end_time::time",
    )


def downgrade() -> None:
    op.alter_column(
        "events",
        "start_time",
        existing_type=sa.Time(),
        type_=postgresql.TIMESTAMP(timezone=True),
        existing_nullable=False,
        postgresql_using="CURRENT_DATE + start_time",
    )

    op.alter_column(
        "events",
        "end_time",
        existing_type=sa.Time(),
        type_=postgresql.TIMESTAMP(timezone=True),
        existing_nullable=False,
        postgresql_using="CURRENT_DATE + end_time",
    )