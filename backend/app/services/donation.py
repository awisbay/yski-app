"""
Donation Service - Business logic for donation management
"""

import random
import string
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.donation import Donation
from app.schemas.donation import DonationCreate, DonationVerify


# Payment Gateway Abstraction
class PaymentGateway(ABC):
    """Abstract base class for payment gateways."""
    
    @abstractmethod
    async def create_payment(self, amount: Decimal, metadata: dict) -> dict:
        """Create a payment transaction."""
        pass
    
    @abstractmethod
    async def check_status(self, transaction_id: str) -> str:
        """Check payment status."""
        pass
    
    @abstractmethod
    async def handle_callback(self, payload: dict) -> dict:
        """Handle payment callback/webhook."""
        pass


class ManualTransferGateway(PaymentGateway):
    """Manual bank transfer payment gateway."""
    
    async def create_payment(self, amount: Decimal, metadata: dict) -> dict:
        """Create manual transfer payment."""
        return {
            "status": "pending",
            "payment_code": self._generate_payment_code(),
            "instructions": f"Transfer {amount} ke rekening Yayasan Sahabat Khairat",
            "expiry_time": "24 jam"
        }
    
    async def check_status(self, transaction_id: str) -> str:
        """Check manual transfer status (requires manual verification)."""
        return "pending"
    
    async def handle_callback(self, payload: dict) -> dict:
        """Manual transfer doesn't have automatic callbacks."""
        return {"status": "pending"}
    
    def _generate_payment_code(self) -> str:
        """Generate unique payment code."""
        return "TRF" + "".join(random.choices(string.digits, k=10))


class MidtransGateway(PaymentGateway):
    """Midtrans payment gateway (placeholder for future implementation)."""
    
    async def create_payment(self, amount: Decimal, metadata: dict) -> dict:
        """Create Midtrans payment."""
        # Placeholder for Midtrans integration
        return {
            "status": "pending",
            "redirect_url": "https://app.midtrans.com/snap/v2/vtweb/token",
            "token": "placeholder_token"
        }
    
    async def check_status(self, transaction_id: str) -> str:
        """Check Midtrans payment status."""
        # Placeholder for Midtrans status check
        return "pending"
    
    async def handle_callback(self, payload: dict) -> dict:
        """Handle Midtrans callback."""
        # Placeholder for Midtrans callback handling
        return {"status": payload.get("transaction_status", "pending")}


class PaymentGatewayFactory:
    """Factory for creating payment gateway instances."""
    
    _gateways = {
        "manual_transfer": ManualTransferGateway,
        "midtrans": MidtransGateway,
        "qris": MidtransGateway,  # Can use same gateway with different config
        "gopay": MidtransGateway,
        "ovo": MidtransGateway,
        "shopeepay": MidtransGateway,
        "bca": MidtransGateway,
        "mandiri": MidtransGateway,
    }
    
    @classmethod
    def get_gateway(cls, method: str) -> PaymentGateway:
        """Get payment gateway instance by method."""
        gateway_class = cls._gateways.get(method, ManualTransferGateway)
        return gateway_class()


def generate_donation_code() -> str:
    """Generate unique donation code."""
    return "CKY-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


class DonationService:
    """Service class for donation operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, donation_id: str) -> Optional[Donation]:
        """Get donation by ID."""
        try:
            uuid_id = UUID(donation_id)
        except ValueError:
            return None
        
        result = await self.db.execute(
            select(Donation).where(Donation.id == uuid_id)
        )
        return result.scalar_one_or_none()
    
    async def list_donations(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        donor_id: Optional[str] = None,
        donation_type: Optional[str] = None
    ) -> List[Donation]:
        """List donations with filters."""
        query = select(Donation)
        
        if status:
            query = query.where(Donation.payment_status == status)
        if donor_id:
            query = query.where(Donation.donor_id == UUID(donor_id))
        if donation_type:
            query = query.where(Donation.donation_type == donation_type)
        
        query = query.offset(skip).limit(limit).order_by(Donation.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def create_donation(self, data: DonationCreate, donor_id: Optional[UUID] = None) -> Donation:
        """Create a new donation."""
        # Generate donation code
        donation_code = generate_donation_code()
        
        # Process payment based on method
        gateway = PaymentGatewayFactory.get_gateway(data.payment_method)
        payment_result = await gateway.create_payment(
            amount=data.amount,
            metadata={
                "donation_code": donation_code,
                "donor_email": data.donor_email,
                "donor_name": data.donor_name
            }
        )
        
        donation = Donation(
            donation_code=donation_code,
            donor_id=donor_id,
            donor_name=data.donor_name,
            donor_email=data.donor_email,
            donor_phone=data.donor_phone,
            amount=data.amount,
            donation_type=data.donation_type,
            program_id=data.program_id,
            payment_method=data.payment_method,
            payment_status="pending",
            message=data.message
        )
        
        self.db.add(donation)
        await self.db.flush()
        await self.db.refresh(donation)
        
        # Attach payment info
        donation.payment_info = payment_result
        
        return donation
    
    async def verify_donation(self, donation_id: str, verified_by: UUID, status: str = "paid") -> Optional[Donation]:
        """Verify a donation (mark as paid)."""
        donation = await self.get_by_id(donation_id)
        if not donation:
            return None
        
        if donation.payment_status not in ["pending", "awaiting_verification"]:
            raise HTTPException(status_code=400, detail="Donation is not pending verification")
        
        donation.payment_status = status
        donation.verified_by = verified_by
        donation.verified_at = datetime.now(timezone.utc)
        
        await self.db.flush()
        await self.db.refresh(donation)
        return donation
    
    async def upload_proof(self, donation_id: str, proof_url: str) -> Optional[Donation]:
        """Upload payment proof for manual transfer."""
        donation = await self.get_by_id(donation_id)
        if not donation:
            return None
        
        donation.proof_url = proof_url
        # Keep status value compatible with existing DB column length.
        # Proof presence indicates waiting admin/pengurus confirmation.
        donation.payment_status = "pending"
        
        await self.db.flush()
        await self.db.refresh(donation)
        return donation
    
    async def handle_payment_callback(self, donation_id: str, payload: dict) -> Optional[Donation]:
        """Handle payment gateway callback."""
        donation = await self.get_by_id(donation_id)
        if not donation:
            return None
        
        gateway = PaymentGatewayFactory.get_gateway(donation.payment_method)
        result = await gateway.handle_callback(payload)
        
        # Update status based on callback
        new_status = result.get("status", "pending")
        if new_status in ["settlement", "capture"]:
            donation.payment_status = "paid"
        elif new_status == "deny":
            donation.payment_status = "cancelled"
        elif new_status == "expire":
            donation.payment_status = "cancelled"
        
        await self.db.flush()
        await self.db.refresh(donation)
        return donation
    
    async def get_summary(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> dict:
        """Get donation summary."""
        query = select(func.count(), func.sum(Donation.amount)).where(Donation.payment_status == "paid")
        
        if start_date:
            query = query.where(Donation.created_at >= start_date)
        if end_date:
            query = query.where(Donation.created_at <= end_date)
        
        result = await self.db.execute(query)
        count, total = result.first()
        
        # Get breakdown by type
        type_query = select(
            Donation.donation_type,
            func.sum(Donation.amount)
        ).where(
            Donation.payment_status == "paid"
        ).group_by(Donation.donation_type)
        
        if start_date:
            type_query = type_query.where(Donation.created_at >= start_date)
        if end_date:
            type_query = type_query.where(Donation.created_at <= end_date)
        
        type_result = await self.db.execute(type_query)
        by_type = {row[0]: row[1] for row in type_result.all()}
        
        return {
            "total_donations": count or 0,
            "total_amount": total or 0,
            "by_type": by_type
        }
