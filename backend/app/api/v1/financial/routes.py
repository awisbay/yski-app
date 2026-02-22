"""
Financial API Routes - transaksi & saldo kategori.
"""

from datetime import date as date_type
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_role
from app.models.user import User
from app.schemas.financial import (
    FinanceCategoryCreate,
    FinanceCategoryResponse,
    FinancialTransactionCreate,
    FinancialTransactionListResponse,
    FinancialTransactionResponse,
    FinancialTransactionReview,
    FinancialBalanceResponse,
)
from app.services.financial_service import FinancialService

router = APIRouter(
    dependencies=[Depends(require_role("admin", "superadmin", "pengurus"))],
)


def _serialize_transaction(item) -> FinancialTransactionResponse:
    return FinancialTransactionResponse(
        id=item.id,
        category_id=item.category_id,
        category_name=item.category.name if item.category else "-",
        transaction_type=item.transaction_type,
        entry_side=item.entry_side,
        amount=item.amount,
        description=item.description,
        requested_by=item.requested_by,
        requester_name=item.requester.full_name if item.requester else "-",
        status=item.status,
        reviewed_by=item.reviewed_by,
        reviewer_name=item.reviewer.full_name if item.reviewer else None,
        reviewed_at=item.reviewed_at,
        reviewed_note=item.reviewed_note,
        approved_at=item.approved_at,
        created_at=item.created_at,
    )


@router.get("/categories", response_model=list[FinanceCategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "superadmin", "pengurus")),
):
    service = FinancialService(db)
    return await service.list_categories()


@router.post("/categories", response_model=FinanceCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: FinanceCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "superadmin", "pengurus")),
):
    service = FinancialService(db)
    return await service.create_category(payload.name)


@router.get("/transactions", response_model=FinancialTransactionListResponse)
async def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=500),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    transaction_type: Optional[str] = Query(default=None),
    category_id: Optional[UUID] = Query(default=None),
    date_from: Optional[date_type] = Query(default=None),
    date_to: Optional[date_type] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "superadmin", "pengurus")),
):
    service = FinancialService(db)
    items, total = await service.list_transactions(
        skip=skip,
        limit=limit,
        status_filter=status_filter,
        transaction_type=transaction_type,
        category_id=category_id,
        date_from=date_from,
        date_to=date_to,
    )
    return {
        "transactions": [_serialize_transaction(item) for item in items],
        "total": total,
    }


@router.post("/transactions", response_model=FinancialTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    payload: FinancialTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "superadmin", "pengurus")),
):
    service = FinancialService(db)
    transaction = await service.create_transaction(
        category_id=payload.category_id,
        transaction_type=payload.transaction_type,
        amount=payload.amount,
        description=payload.description,
        requester=current_user,
    )
    await db.refresh(transaction, attribute_names=["category", "requester", "reviewer"])
    return _serialize_transaction(transaction)


@router.patch("/transactions/{transaction_id}/review", response_model=FinancialTransactionResponse)
async def review_transaction(
    transaction_id: UUID,
    payload: FinancialTransactionReview,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "superadmin")),
):
    service = FinancialService(db)
    transaction = await service.review_transaction(
        transaction_id=transaction_id,
        status=payload.status,
        reviewed_note=payload.reviewed_note,
        reviewer=current_user,
    )
    await db.refresh(transaction, attribute_names=["category", "requester", "reviewer"])
    return _serialize_transaction(transaction)


@router.get("/balances", response_model=FinancialBalanceResponse)
async def get_balances(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "superadmin", "pengurus")),
):
    service = FinancialService(db)
    return await service.get_balances()
