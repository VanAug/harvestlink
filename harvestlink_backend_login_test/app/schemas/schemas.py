from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    email: str
    full_name: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    role: str
    status: str

class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int
    name: str
    type: str
    country: str
    address: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    verification_status: str
    products_offered: Optional[str] = None
    certifications: Optional[str] = None
    export_capacity: Optional[str] = None
    export_markets: Optional[str] = None
    sourcing_markets: Optional[str] = None
    buying_interests: Optional[str] = None
    preferred_destinations: Optional[str] = None

class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company_id: int
    supplier_name: str
    name: str
    category: str
    variety: Optional[str] = None
    grade: Optional[str] = None
    country_of_origin: str
    available_quantity: float
    unit: str
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    minimum_order_quantity: Optional[float] = None
    description: Optional[str] = None
    image_key: Optional[str] = None
    status: str

class ProductCreate(BaseModel):
    company_id: int
    supplier_name: str
    name: str
    category: str
    variety: Optional[str] = None
    grade: Optional[str] = None
    country_of_origin: str
    available_quantity: float
    unit: str
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    minimum_order_quantity: Optional[float] = None
    description: Optional[str] = None
    image_key: Optional[str] = None
    status: str = "active"

class RFQOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    buyer_company_id: int
    buyer_name: str
    product_category: str
    product_name: str
    quantity: float
    unit: str
    destination_country: str
    delivery_timeline: str
    target_price: Optional[float] = None
    additional_notes: Optional[str] = None
    status: str

class OfferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    rfq_id: int
    exporter_company_id: int
    exporter_name: str
    price: float
    quantity: float
    delivery_terms: str
    estimated_delivery_date: str
    notes: Optional[str] = None
    status: str

class DealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    buyer_company_id: int
    exporter_company_id: int
    buyer_name: str
    exporter_name: str
    rfq_id: Optional[int] = None
    offer_id: Optional[int] = None
    product_name: str
    quantity: float
    unit: str
    total_amount: float
    currency: str
    destination_country: str
    delivery_terms: str
    status: str
    escrow_status: str

class MessageCreate(BaseModel):
    sender_company_id: int
    sender_name: str
    message: str

class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    deal_id: int
    sender_company_id: int
    sender_name: str
    message: str

class EscrowOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    deal_id: int
    payment_reference: str
    amount: float
    currency: str
    fees: float
    payer_company_id: int
    recipient_company_id: int
    status: str

class FinancingCreate(BaseModel):
    exporter_company_id: int
    exporter_name: str
    requested_amount: float
    currency: str = "USD"
    purpose: str
    linked_deal_id: Optional[int] = None

class FinancingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    exporter_company_id: int
    exporter_name: str
    requested_amount: float
    eligible_amount: float
    currency: str
    purpose: str
    linked_deal_id: Optional[int] = None
    score: float
    status: str

class DashboardOut(BaseModel):
    company_id: int
    total_deals: int
    completed_deals: int
    total_trade_value: float
    total_volume: float
    financing_eligible_amount: float
    trade_score: float

class StatsOut(BaseModel):
    users: int
    companies: int
    exporters: int
    buyers: int
    products: int
    rfqs: int
    deals: int
    escrow_transactions: int
    financing_requests: int
