"""Initial migration - Create users and role_permissions tables

Revision ID: 001
Revises: 
Create Date: 2026-02-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)
    
    # Create role_permissions table
    op.create_table(
        'role_permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('resource', sa.String(length=50), nullable=False),
        sa.Column('action', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('role', 'resource', 'action', name='uq_role_resource_action')
    )
    op.create_index(op.f('ix_role_permissions_role'), 'role_permissions', ['role'], unique=False)
    
    # Seed role permissions
    seed_role_permissions()


def downgrade() -> None:
    op.drop_index(op.f('ix_role_permissions_role'), table_name='role_permissions')
    op.drop_table('role_permissions')
    op.drop_index(op.f('ix_users_role'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')


def seed_role_permissions():
    """Seed initial role permissions."""
    permissions = [
        # Admin - Full access
        ('admin', 'users', 'create'), ('admin', 'users', 'read'), ('admin', 'users', 'update'), ('admin', 'users', 'delete'),
        ('admin', 'bookings', 'create'), ('admin', 'bookings', 'read'), ('admin', 'bookings', 'update'), ('admin', 'bookings', 'delete'),
        ('admin', 'bookings', 'approve'), ('admin', 'bookings', 'reject'), ('admin', 'bookings', 'assign'),
        ('admin', 'donations', 'create'), ('admin', 'donations', 'read'), ('admin', 'donations', 'update'), ('admin', 'donations', 'delete'),
        ('admin', 'donations', 'verify'),
        ('admin', 'pickups', 'create'), ('admin', 'pickups', 'read'), ('admin', 'pickups', 'update'), ('admin', 'pickups', 'delete'),
        ('admin', 'pickups', 'assign'),
        ('admin', 'equipment', 'create'), ('admin', 'equipment', 'read'), ('admin', 'equipment', 'update'), ('admin', 'equipment', 'delete'),
        ('admin', 'equipment_loans', 'create'), ('admin', 'equipment_loans', 'read'), ('admin', 'equipment_loans', 'update'),
        ('admin', 'equipment_loans', 'approve'), ('admin', 'equipment_loans', 'reject'),
        ('admin', 'content', 'create'), ('admin', 'content', 'read'), ('admin', 'content', 'update'), ('admin', 'content', 'delete'),
        ('admin', 'content', 'publish'),
        ('admin', 'finance', 'create'), ('admin', 'finance', 'read'), ('admin', 'finance', 'update'), ('admin', 'finance', 'delete'),
        
        # Pengurus - Management permissions
        ('pengurus', 'bookings', 'create'), ('pengurus', 'bookings', 'read'), ('pengurus', 'bookings', 'update'),
        ('pengurus', 'bookings', 'approve'), ('pengurus', 'bookings', 'reject'), ('pengurus', 'bookings', 'assign'),
        ('pengurus', 'donations', 'create'), ('pengurus', 'donations', 'read'), ('pengurus', 'donations', 'update'),
        ('pengurus', 'donations', 'verify'),
        ('pengurus', 'pickups', 'create'), ('pengurus', 'pickups', 'read'), ('pengurus', 'pickups', 'update'),
        ('pengurus', 'pickups', 'assign'),
        ('pengurus', 'equipment', 'create'), ('pengurus', 'equipment', 'read'), ('pengurus', 'equipment', 'update'),
        ('pengurus', 'equipment_loans', 'read'), ('pengurus', 'equipment_loans', 'update'),
        ('pengurus', 'equipment_loans', 'approve'), ('pengurus', 'equipment_loans', 'reject'),
        ('pengurus', 'content', 'create'), ('pengurus', 'content', 'read'), ('pengurus', 'content', 'update'),
        ('pengurus', 'content', 'delete'), ('pengurus', 'content', 'publish'),
        ('pengurus', 'finance', 'create'), ('pengurus', 'finance', 'read'), ('pengurus', 'finance', 'update'),
        
        # Relawan - Limited permissions
        ('relawan', 'bookings', 'read_assigned'), ('relawan', 'bookings', 'update_assigned'),
        ('relawan', 'donations', 'create'), ('relawan', 'donations', 'read_own'),
        ('relawan', 'pickups', 'read_assigned'), ('relawan', 'pickups', 'update_assigned'),
        ('relawan', 'equipment', 'read'),
        ('relawan', 'content', 'read'),
        ('relawan', 'finance', 'read'),
        
        # Sahabat - Service consumer
        ('sahabat', 'bookings', 'create'), ('sahabat', 'bookings', 'read_own'), ('sahabat', 'bookings', 'update_own'),
        ('sahabat', 'donations', 'create'), ('sahabat', 'donations', 'read_own'),
        ('sahabat', 'pickups', 'create'), ('sahabat', 'pickups', 'read_own'),
        ('sahabat', 'equipment', 'read'),
        ('sahabat', 'equipment_loans', 'create'), ('sahabat', 'equipment_loans', 'read_own'),
        ('sahabat', 'content', 'read'),
        ('sahabat', 'finance', 'read'),
    ]
    
    for role, resource, action in permissions:
        op.execute(
            sa.text(
                "INSERT INTO role_permissions (id, role, resource, action) VALUES (gen_random_uuid(), :role, :resource, :action)"
            ).bindparams(role=role, resource=resource, action=action)
        )
