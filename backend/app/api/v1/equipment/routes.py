"""
Equipment Routes
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.equipment import EquipmentCreate, EquipmentResponse, EquipmentUpdate, EquipmentLoanCreate, EquipmentLoanResponse
from app.services.equipment import EquipmentService

router = APIRouter()


@router.get("", response_model=List[EquipmentResponse])
async def list_equipment(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: str = Query(None),
    available_only: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """List all equipment."""
    service = EquipmentService(db)
    equipment = await service.list_equipment(
        skip=skip, limit=limit, category=category, available_only=available_only
    )
    return equipment


@router.get("/stats")
async def get_equipment_stats(
    db: AsyncSession = Depends(get_db)
):
    """Get equipment statistics."""
    service = EquipmentService(db)
    return await service.get_stats()


@router.get("/my-loans", response_model=List[EquipmentLoanResponse])
async def get_my_loans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's equipment loans."""
    service = EquipmentService(db)
    loans = await service.list_loans(borrower_id=str(current_user.id))
    return loans


@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(
    equipment_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get equipment by ID."""
    service = EquipmentService(db)
    equipment = await service.get_by_id(str(equipment_id))
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment


@router.post("", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_equipment(
    equipment_data: EquipmentCreate,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Create new equipment (Admin/Pengurus only)."""
    service = EquipmentService(db)
    equipment = await service.create_equipment(equipment_data)
    return equipment


@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: UUID,
    equipment_data: EquipmentUpdate,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Update equipment (Admin/Pengurus only)."""
    service = EquipmentService(db)
    equipment = await service.update_equipment(str(equipment_id), equipment_data)
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment(
    equipment_id: UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Delete equipment (Admin only)."""
    service = EquipmentService(db)
    success = await service.delete_equipment(str(equipment_id))
    if not success:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return None


# === Loan Endpoints ===

@router.get("/loans/all", response_model=List[EquipmentLoanResponse])
async def list_loans(
    status: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """List all loans (Admin/Pengurus only)."""
    service = EquipmentService(db)
    loans = await service.list_loans(skip=skip, limit=limit, status=status)
    return loans


@router.post("/{equipment_id}/borrow", response_model=EquipmentLoanResponse, status_code=status.HTTP_201_CREATED)
async def request_loan(
    equipment_id: UUID,
    loan_data: EquipmentLoanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Request to borrow equipment."""
    service = EquipmentService(db)
    loan = await service.request_loan(str(equipment_id), loan_data, current_user.id)
    return loan


@router.patch("/loans/{loan_id}/approve", response_model=EquipmentLoanResponse)
async def approve_loan(
    loan_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Approve a loan request (Admin/Pengurus only)."""
    service = EquipmentService(db)
    loan = await service.approve_loan(str(loan_id), current_user.id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


@router.patch("/loans/{loan_id}/reject", response_model=EquipmentLoanResponse)
async def reject_loan(
    loan_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Reject a loan request (Admin/Pengurus only)."""
    service = EquipmentService(db)
    loan = await service.reject_loan(str(loan_id))
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


@router.patch("/loans/{loan_id}/borrowed", response_model=EquipmentLoanResponse)
async def mark_as_borrowed(
    loan_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus", "relawan")),
    db: AsyncSession = Depends(get_db)
):
    """Mark loan as borrowed."""
    service = EquipmentService(db)
    loan = await service.mark_as_borrowed(str(loan_id))
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


@router.patch("/loans/{loan_id}/returned", response_model=EquipmentLoanResponse)
async def mark_as_returned(
    loan_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus", "relawan")),
    db: AsyncSession = Depends(get_db)
):
    """Mark loan as returned."""
    service = EquipmentService(db)
    loan = await service.mark_as_returned(str(loan_id))
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan
