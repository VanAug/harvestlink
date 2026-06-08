"""Exporter verification enforcement service.

Checks the exporter company's verification_status (verification_status on the Company model).
If the company is not verified, the exporter cannot create products or submit offers.
Products created by verified exporters go through the admin moderation queue (product.status = pending).
"""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import User, Company


async def require_verified_exporter(
    current_user: User,
    db: AsyncSession,
    company_id: int | None = None,
) -> User:
    """Check that the current user owns a verified exporter company.
    
    - Admin users bypass this check.
    - If company_id is provided, checks that specific company's verification_status.
    - If company_id is None, checks all exporter companies owned by the user.
    
    Raises 403 if no verified exporter company is found.
    """
    if current_user.role == "admin":
        return current_user

    if current_user.role not in ("exporter", "supplier"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only exporters can perform this action",
        )

    from sqlalchemy import select
    
    # If a specific company is targeted, check that one
    if company_id is not None:
        company = await db.get(Company, company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        if company.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't own this company")
        if company.verification_status != "verified":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "title": "Company Not Verified",
                    "message": f"Your company '{company.name}'  verification status is {company.verification_status}. "
                               "Verify Company to list products or submit offers.",
                    "resolution": "Upload your verification documents via your company profile. "
                                  "An admin will review and verify your company.",
                    "current_status": company.verification_status,
                    "action_required": "Submit company documents for admin verification.",
                },
            )
        return current_user

    # No specific company — check that the user has at least one verified exporter company
    companies = await db.scalars(
        select(Company).where(
            Company.owner_id == current_user.id,
            Company.type == "exporter",
        )
    )
    companies_list = list(companies)
    
    if not companies_list:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "title": "No Exporter Company Found",
                "message": "You need to create an exporter company profile before listing products.",
                "resolution": "Go to your Exporter Profile and create a company.",
            },
        )
    
    verified = [c for c in companies_list if c.verification_status == "verified"]
    if not verified:
        statuses = ", ".join(c.verification_status for c in companies_list)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "title": "Company Verification Required",
                "message": f"Your exporter company is not verified (status: {statuses}). "
                           "You need a verified company to list products or submit offers.",
                "resolution": "Upload your verification documents via your company profile. "
                              "An admin will review and verify your company.",
            },
        )
    
    return current_user
