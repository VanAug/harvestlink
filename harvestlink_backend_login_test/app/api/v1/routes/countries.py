from fastapi import APIRouter

router = APIRouter()


@router.get("/countries")
async def countries():
    # Minimal canonical country list used by frontend dropdowns
    return [
        {"code": "KE", "name": "Kenya"},
        {"code": "TZ", "name": "Tanzania"},
        {"code": "ET", "name": "Ethiopia"},
        {"code": "UG", "name": "Uganda"},
        {"code": "NG", "name": "Nigeria"},
        {"code": "IN", "name": "India"},
        {"code": "AE", "name": "United Arab Emirates"},
        {"code": "SA", "name": "Saudi Arabia"},
        {"code": "NL", "name": "Netherlands"},
        {"code": "DE", "name": "Germany"},
        {"code": "GB", "name": "United Kingdom"},
        {"code": "US", "name": "United States"},
    ]
