from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), index=True)
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Company(Base):
    __tablename__ = "companies"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(255), index=True)
    type: Mapped[str] = mapped_column(String(50), index=True)
    country: Mapped[str] = mapped_column(String(100), index=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="pending")
    products_offered: Mapped[str | None] = mapped_column(Text, nullable=True)
    certifications: Mapped[str | None] = mapped_column(Text, nullable=True)
    export_capacity: Mapped[str | None] = mapped_column(String(255), nullable=True)
    export_markets: Mapped[str | None] = mapped_column(Text, nullable=True)
    sourcing_markets: Mapped[str | None] = mapped_column(Text, nullable=True)
    buying_interests: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_destinations: Mapped[str | None] = mapped_column(Text, nullable=True)

class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    supplier_name: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str] = mapped_column(String(100), index=True)
    variety: Mapped[str | None] = mapped_column(String(100), nullable=True)
    grade: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country_of_origin: Mapped[str] = mapped_column(String(100), index=True)
    available_quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(50))
    price_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    minimum_order_quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_key: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")

class RFQ(Base):
    __tablename__ = "rfqs"
    id: Mapped[int] = mapped_column(primary_key=True)
    buyer_company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    buyer_name: Mapped[str] = mapped_column(String(255))
    product_category: Mapped[str] = mapped_column(String(100))
    product_name: Mapped[str] = mapped_column(String(255), index=True)
    quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(50))
    destination_country: Mapped[str] = mapped_column(String(100))
    delivery_timeline: Mapped[str] = mapped_column(String(255))
    target_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    additional_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="open")

class Offer(Base):
    __tablename__ = "offers"
    id: Mapped[int] = mapped_column(primary_key=True)
    rfq_id: Mapped[int] = mapped_column(ForeignKey("rfqs.id"))
    exporter_company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    exporter_name: Mapped[str] = mapped_column(String(255))
    price: Mapped[float] = mapped_column(Float)
    quantity: Mapped[float] = mapped_column(Float)
    delivery_terms: Mapped[str] = mapped_column(String(255))
    estimated_delivery_date: Mapped[str] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="submitted")

class Deal(Base):
    __tablename__ = "deals"
    id: Mapped[int] = mapped_column(primary_key=True)
    buyer_company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    exporter_company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    buyer_name: Mapped[str] = mapped_column(String(255))
    exporter_name: Mapped[str] = mapped_column(String(255))
    rfq_id: Mapped[int | None] = mapped_column(ForeignKey("rfqs.id"), nullable=True)
    offer_id: Mapped[int | None] = mapped_column(ForeignKey("offers.id"), nullable=True)
    product_name: Mapped[str] = mapped_column(String(255))
    quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(50))
    total_amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    destination_country: Mapped[str] = mapped_column(String(100))
    delivery_terms: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="agreed")
    escrow_status: Mapped[str] = mapped_column(String(50), default="pending_deposit")

class Message(Base):
    __tablename__ = "messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    deal_id: Mapped[int] = mapped_column(ForeignKey("deals.id"))
    sender_company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    sender_name: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class EscrowTransaction(Base):
    __tablename__ = "escrow_transactions"
    id: Mapped[int] = mapped_column(primary_key=True)
    deal_id: Mapped[int] = mapped_column(ForeignKey("deals.id"))
    payment_reference: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    fees: Mapped[float] = mapped_column(Float, default=0)
    payer_company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    recipient_company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    status: Mapped[str] = mapped_column(String(50), default="pending_deposit")

class FinancingRequest(Base):
    __tablename__ = "financing_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    exporter_company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    exporter_name: Mapped[str] = mapped_column(String(255))
    requested_amount: Mapped[float] = mapped_column(Float)
    eligible_amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    purpose: Mapped[str] = mapped_column(Text)
    linked_deal_id: Mapped[int | None] = mapped_column(ForeignKey("deals.id"), nullable=True)
    score: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(50), default="submitted")

class TradeDocument(Base):
    __tablename__ = "trade_documents"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_type: Mapped[str] = mapped_column(String(50), index=True)
    owner_id: Mapped[int] = mapped_column(index=True)
    document_type: Mapped[str] = mapped_column(String(100), index=True)
    title: Mapped[str] = mapped_column(String(255))
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="submitted")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
