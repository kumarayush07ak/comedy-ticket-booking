"""add email verification fields

Revision ID: 645c1787f341
Revises: 7af2ad5187a6
Create Date: 2026-09-20 22:14:07.448950

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "645c1787f341"
down_revision: Union[str, Sequence[str], None] = "7af2ad5187a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Add the verification columns.
    #
    # email_verified initially allows NULL so existing rows can be
    # safely converted to verified before making the column NOT NULL.
    op.add_column(
        "users",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "email_verification_token_hash",
            sa.String(length=255),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "email_verification_expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # Existing accounts were created before email verification existed.
    # Keep them usable by treating their email as already verified.
    op.execute(
        "UPDATE users SET email_verified = TRUE"
    )

    # New users will be created with email_verified = FALSE.
    op.alter_column(
        "users",
        "email_verified",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default=sa.text("false"),
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "users",
        "email_verification_expires_at",
    )

    op.drop_column(
        "users",
        "email_verification_token_hash",
    )

    op.drop_column(
        "users",
        "email_verified",
    )