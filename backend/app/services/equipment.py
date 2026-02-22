"""
Equipment Service - Business logic for medical equipment management
"""

import random
import string
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.equipment import MedicalEquipment, EquipmentLoan
from app.models.user import User
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate, EquipmentLoanCreate, EquipmentLoanUpdate
from app.services.notification_service import NotificationService


def generate_loan_code() -> str:
    """Generate unique loan code."""
    return "LN-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


class EquipmentService:
    """Service class for equipment operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, equipment_id: str) -> Optional[MedicalEquipment]:
        """Get equipment by ID."""
        try:
            uuid_id = UUID(equipment_id)
        except ValueError:
            return None
        
        result = await self.db.execute(
            select(MedicalEquipment).where(MedicalEquipment.id == uuid_id)
        )
        return result.scalar_one_or_none()
    
    async def list_equipment(
        self,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        available_only: bool = False
    ) -> List[MedicalEquipment]:
        """List equipment with filters."""
        query = select(MedicalEquipment).where(MedicalEquipment.is_active == True)
        
        if category:
            query = query.where(MedicalEquipment.category == category)
        if available_only:
            query = query.where(MedicalEquipment.available_stock > 0)
        
        query = query.offset(skip).limit(limit).order_by(MedicalEquipment.name)
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def create_equipment(self, data: EquipmentCreate) -> MedicalEquipment:
        """Create new equipment."""
        equipment = MedicalEquipment(
            name=data.name,
            category=data.category,
            description=data.description,
            photo_url=data.photo_url,
            total_stock=data.total_stock,
            available_stock=data.total_stock,  # Initially all stock is available
            condition=data.condition,
            is_active=True
        )
        self.db.add(equipment)
        await self.db.flush()
        await self.db.refresh(equipment)
        return equipment
    
    async def update_equipment(self, equipment_id: str, data: EquipmentUpdate) -> Optional[MedicalEquipment]:
        """Update equipment."""
        equipment = await self.get_by_id(equipment_id)
        if not equipment:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(equipment, field, value)
        
        await self.db.flush()
        await self.db.refresh(equipment)
        return equipment
    
    async def delete_equipment(self, equipment_id: str) -> bool:
        """Soft delete equipment."""
        equipment = await self.get_by_id(equipment_id)
        if not equipment:
            return False
        
        equipment.is_active = False
        await self.db.flush()
        return True
    
    # === Equipment Loan Methods ===
    
    async def get_loan_by_id(self, loan_id: str) -> Optional[EquipmentLoan]:
        """Get loan by ID."""
        try:
            uuid_id = UUID(loan_id)
        except ValueError:
            return None
        
        result = await self.db.execute(
            select(EquipmentLoan)
            .options(selectinload(EquipmentLoan.equipment))
            .where(EquipmentLoan.id == uuid_id)
        )
        return result.scalar_one_or_none()
    
    async def list_loans(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        borrower_id: Optional[str] = None,
        equipment_id: Optional[str] = None
    ) -> List[EquipmentLoan]:
        """List loans with filters."""
        query = select(EquipmentLoan)
        query = query.options(selectinload(EquipmentLoan.equipment))
        
        if status:
            query = query.where(EquipmentLoan.status == status)
        if borrower_id:
            query = query.where(EquipmentLoan.borrower_id == UUID(borrower_id))
        if equipment_id:
            query = query.where(EquipmentLoan.equipment_id == UUID(equipment_id))
        
        query = query.offset(skip).limit(limit).order_by(EquipmentLoan.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def _get_loan_with_equipment(self, loan_id: UUID) -> Optional[EquipmentLoan]:
        result = await self.db.execute(
            select(EquipmentLoan)
            .options(selectinload(EquipmentLoan.equipment))
            .where(EquipmentLoan.id == loan_id)
        )
        return result.scalar_one_or_none()
    
    async def request_loan(self, equipment_id: str, data: EquipmentLoanCreate, borrower_id: UUID) -> EquipmentLoan:
        """Create a loan request."""
        equipment = await self.get_by_id(equipment_id)
        if not equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        if equipment.available_stock <= 0:
            raise HTTPException(status_code=400, detail="Equipment not available")

        if data.return_date and data.return_date <= data.borrow_date:
            raise HTTPException(status_code=400, detail="Tanggal kembali harus setelah tanggal pinjam")
        
        loan = EquipmentLoan(
            equipment_id=UUID(equipment_id),
            borrower_id=borrower_id,
            borrower_name=data.borrower_name,
            borrower_phone=data.borrower_phone,
            borrow_date=data.borrow_date,
            return_date=data.return_date,
            borrow_location=data.borrow_location,
            borrow_lat=data.borrow_lat,
            borrow_lng=data.borrow_lng,
            status="pending",
            notes=data.notes
        )
        self.db.add(loan)
        await self.db.flush()
        await self.db.refresh(loan)

        # Notify admin + pengurus for incoming loan request.
        staff_result = await self.db.execute(
            select(User.id).where(
                User.role.in_(["admin", "pengurus"]),
                User.is_active == True,  # noqa: E712
            )
        )
        staff_ids = [row[0] for row in staff_result.all()]
        if staff_ids:
            notif = NotificationService(self.db)
            await notif.create_bulk_notifications(
                user_ids=staff_ids,
                title="Permintaan Peminjaman Baru",
                body=f"{data.borrower_name} mengajukan pinjam {equipment.name}.",
                type="info",
                reference_type="loan",
                reference_id=loan.id,
            )
        loaded_loan = await self._get_loan_with_equipment(loan.id)
        return loaded_loan or loan
    
    async def approve_loan(self, loan_id: str, approved_by: UUID) -> Optional[EquipmentLoan]:
        """Approve a loan request with pessimistic locking on equipment stock."""
        loan = await self.get_loan_by_id(loan_id)
        if not loan:
            return None

        if loan.status != "pending":
            raise HTTPException(status_code=400, detail="Loan is not pending")

        # Lock equipment row before decrementing stock
        result = await self.db.execute(
            select(MedicalEquipment)
            .with_for_update()
            .where(MedicalEquipment.id == loan.equipment_id)
        )
        equipment = result.scalar_one_or_none()
        if not equipment or equipment.available_stock <= 0:
            raise HTTPException(status_code=400, detail="Equipment not available")

        # Update loan status
        loan.status = "approved"
        loan.approved_by = approved_by

        # Decrease available stock
        equipment.available_stock -= 1

        await self.db.flush()
        await self.db.refresh(loan)

        # Notify borrower that request is approved.
        notif = NotificationService(self.db)
        await notif.create_notification(
            user_id=loan.borrower_id,
            title="Peminjaman Disetujui",
            body=f"Permintaan pinjam {equipment.name} telah disetujui.",
            type="success",
            reference_type="loan",
            reference_id=loan.id,
            send_push=True,
        )
        loaded_loan = await self._get_loan_with_equipment(loan.id)
        return loaded_loan or loan
    
    async def reject_loan(self, loan_id: str) -> Optional[EquipmentLoan]:
        """Reject a loan request."""
        loan = await self.get_loan_by_id(loan_id)
        if not loan:
            return None
        
        if loan.status != "pending":
            raise HTTPException(status_code=400, detail="Loan is not pending")
        
        loan.status = "rejected"
        await self.db.flush()
        await self.db.refresh(loan)

        # Notify borrower that request is rejected.
        notif = NotificationService(self.db)
        await notif.create_notification(
            user_id=loan.borrower_id,
            title="Peminjaman Ditolak",
            body="Permintaan peminjaman peralatan Anda ditolak.",
            type="warning",
            reference_type="loan",
            reference_id=loan.id,
            send_push=True,
        )
        loaded_loan = await self._get_loan_with_equipment(loan.id)
        return loaded_loan or loan
    
    async def mark_as_borrowed(self, loan_id: str) -> Optional[EquipmentLoan]:
        """Mark loan as borrowed (when item is picked up)."""
        loan = await self.get_loan_by_id(loan_id)
        if not loan:
            return None
        
        if loan.status != "approved":
            raise HTTPException(status_code=400, detail="Loan must be approved first")
        
        loan.status = "borrowed"
        await self.db.flush()
        await self.db.refresh(loan)
        loaded_loan = await self._get_loan_with_equipment(loan.id)
        return loaded_loan or loan
    
    async def mark_as_returned(self, loan_id: str) -> Optional[EquipmentLoan]:
        """Mark loan as returned."""
        loan = await self.get_loan_by_id(loan_id)
        if not loan:
            return None
        
        if loan.status != "borrowed":
            raise HTTPException(status_code=400, detail="Loan must be borrowed first")
        
        loan.status = "returned"
        
        # Increase available stock
        equipment = await self.get_by_id(str(loan.equipment_id))
        equipment.available_stock += 1
        
        await self.db.flush()
        await self.db.refresh(loan)
        loaded_loan = await self._get_loan_with_equipment(loan.id)
        return loaded_loan or loan
    
    async def get_stats(self) -> dict:
        """Get equipment statistics."""
        total = await self.db.scalar(
            select(func.count()).select_from(MedicalEquipment).where(MedicalEquipment.is_active == True)
        )
        
        borrowed = await self.db.scalar(
            select(func.count()).select_from(EquipmentLoan).where(EquipmentLoan.status.in_(["approved", "borrowed"]))
        )
        borrowed_active = await self.db.scalar(
            select(func.count()).select_from(EquipmentLoan).where(EquipmentLoan.status == "borrowed")
        )
        
        pending = await self.db.scalar(
            select(func.count()).select_from(EquipmentLoan).where(EquipmentLoan.status == "pending")
        )
        
        available = await self.db.scalar(
            select(func.sum(MedicalEquipment.available_stock)).where(MedicalEquipment.is_active == True)
        )
        
        return {
            "total": total or 0,
            "borrowed": borrowed or 0,
            "borrowed_active": borrowed_active or 0,
            "pending_requests": pending or 0,
            "available": available or 0
        }
