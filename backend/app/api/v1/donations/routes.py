"""
Donation Routes
"""

import uuid as uuid_mod
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_current_user, require_role
from app.models.user import User
from app.schemas.donation import DonationCreate, DonationResponse, DonationVerify
from app.services.donation import DonationService

ALLOWED_UPLOAD_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5MB

router = APIRouter()


@router.get("", response_model=List[DonationResponse])
async def list_donations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    donation_type: str = Query(None),
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """List all donations (Admin/Pengurus only)."""
    service = DonationService(db)
    donations = await service.list_donations(
        skip=skip, limit=limit, status=status, donation_type=donation_type
    )
    return donations


@router.get("/my", response_model=List[DonationResponse])
async def get_my_donations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's donations."""
    service = DonationService(db)
    donations = await service.list_donations(donor_id=str(current_user.id))
    return donations


@router.get("/summary")
async def get_donation_summary(
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Get donation summary (Admin/Pengurus only)."""
    service = DonationService(db)
    return await service.get_summary()


@router.get("/{donation_id}", response_model=DonationResponse)
async def get_donation(
    donation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get donation by ID."""
    service = DonationService(db)
    donation = await service.get_by_id(str(donation_id))
    
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    
    # Check ownership or role
    if (donation.donor_id != current_user.id and 
        current_user.role not in ["admin", "pengurus"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return donation


@router.post("", response_model=DonationResponse, status_code=status.HTTP_201_CREATED)
async def create_donation(
    donation_data: DonationCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new donation (public or authenticated)."""
    service = DonationService(db)
    donor_id = current_user.id if current_user else None
    donation = await service.create_donation(donation_data, donor_id)
    return donation


@router.patch("/{donation_id}/verify", response_model=DonationResponse)
async def verify_donation(
    donation_id: UUID,
    verify_data: DonationVerify,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Verify a donation (Admin/Pengurus only)."""
    service = DonationService(db)
    donation = await service.verify_donation(
        str(donation_id), current_user.id, verify_data.status
    )
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    return donation


@router.post("/{donation_id}/upload-proof", response_model=DonationResponse)
async def upload_payment_proof(
    donation_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload payment proof for manual transfer."""
    service = DonationService(db)
    donation = await service.get_by_id(str(donation_id))
    
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    
    if donation.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate file type
    if file.content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: jpeg, png, pdf",
        )

    # Validate file size
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB")
    await file.seek(0)

    # Generate safe filename to prevent path traversal
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
    safe_filename = f"{donation_id}_{uuid_mod.uuid4().hex}.{ext}"
    proof_url = f"/uploads/proofs/{safe_filename}"

    # TODO: Implement file upload to MinIO and get URL
    donation = await service.upload_proof(str(donation_id), proof_url)
    return donation


@router.post("/webhook/{donation_id}")
async def handle_payment_webhook(
    donation_id: UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db)
):
    """Handle payment gateway webhook.

    TODO: Add rate limiting middleware to this endpoint.
    """
    # Validate required payload fields
    if not payload or "transaction_status" not in payload:
        raise HTTPException(status_code=400, detail="Invalid webhook payload")

    # TODO: Verify HMAC signature from payment gateway header
    # signature = request.headers.get("X-Signature")
    # if not verify_webhook_signature(payload, signature, settings.WEBHOOK_SECRET):
    #     raise HTTPException(status_code=403, detail="Invalid signature")

    service = DonationService(db)
    donation = await service.handle_payment_callback(str(donation_id), payload)
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    return {"status": "success", "donation_status": donation.payment_status}
