from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_password
from app.models.models import User, Company, Product, RFQ, Offer, Deal, Message, EscrowTransaction, FinancingRequest

async def seed(db: AsyncSession):
    existing = await db.scalar(select(User).where(User.email == "admin@harvestlink.test"))
    if existing:
        return

    users = [
        User(email="admin@harvestlink.test", full_name="HarvestLink Admin", password_hash=hash_password("password123"), role="admin", status="active"),
        User(email="exporter@greenvalley.co.ke", full_name="Grace Wanjiku", password_hash=hash_password("password123"), role="exporter", status="active"),
        User(email="sales@abyssiniacoffee.et", full_name="Tadesse Bekele", password_hash=hash_password("password123"), role="exporter", status="active"),
        User(email="ops@riftflowers.co.ke", full_name="Kevin Mwangi", password_hash=hash_password("password123"), role="exporter", status="active"),
        User(email="procurement@gulffresh.ae", full_name="Omar Al Mansoori", password_hash=hash_password("password123"), role="buyer", status="active"),
        User(email="sourcing@dutchfresh.nl", full_name="Eva Janssen", password_hash=hash_password("password123"), role="buyer", status="active"),
        User(email="finance@tradecapital.test", full_name="Trade Capital Partner", password_hash=hash_password("password123"), role="finance_partner", status="active"),
    ]
    db.add_all(users)
    await db.flush()

    companies = [
        Company(owner_id=users[1].id, name="Green Valley Avocados Ltd", type="exporter", country="Kenya", address="Nairobi, Kenya", description="Verified Hass avocado exporter serving Middle East and European buyers.", website="https://greenvalley.example", verification_status="verified", products_offered="Hass Avocados, Fuerte Avocados, Fresh Herbs", certifications="GlobalG.A.P, HACCP", export_capacity="20 tons/week", export_markets="UAE, Netherlands, Saudi Arabia"),
        Company(owner_id=users[2].id, name="Abyssinia Coffee Exporters", type="exporter", country="Ethiopia", address="Addis Ababa, Ethiopia", description="Premium Arabica coffee exporter with traceable lots.", website="https://abyssiniacoffee.example", verification_status="verified", products_offered="Arabica Coffee", certifications="Organic, Fairtrade", export_capacity="8 tons/month", export_markets="Germany, Netherlands, USA"),
        Company(owner_id=users[3].id, name="Rift Valley Flowers", type="exporter", country="Kenya", address="Naivasha, Kenya", description="Fresh cut flower exporter supplying Europe and Middle East.", website="https://riftflowers.example", verification_status="verified", products_offered="Roses, Summer Flowers", certifications="MPS, GlobalG.A.P", export_capacity="40 boxes/week", export_markets="Netherlands, UAE, UK"),
        Company(owner_id=users[4].id, name="Gulf Fresh Imports LLC", type="buyer", country="United Arab Emirates", address="Dubai, UAE", description="Importer of fresh produce for UAE retail and hospitality markets.", website="https://gulffresh.example", verification_status="verified", sourcing_markets="Kenya, Tanzania, Ethiopia", buying_interests="Avocados, herbs, fruits", preferred_destinations="UAE"),
        Company(owner_id=users[5].id, name="Dutch Fresh BV", type="buyer", country="Netherlands", address="Rotterdam, Netherlands", description="European fresh produce importer and distributor.", website="https://dutchfresh.example", verification_status="verified", sourcing_markets="East Africa, West Africa", buying_interests="Flowers, beans, avocados, coffee", preferred_destinations="Netherlands, Germany"),
        Company(owner_id=users[6].id, name="Trade Capital Partners", type="finance_partner", country="Kenya", address="Nairobi, Kenya", description="Trade finance partner supporting working capital for exporters.", website="https://tradecapital.example", verification_status="verified"),
    ]
    db.add_all(companies)
    await db.flush()

    products = [
        Product(company_id=companies[0].id, supplier_name=companies[0].name, name="Hass Avocados", category="Fruits and Vegetables", variety="Hass", grade="Export Grade", country_of_origin="Kenya", available_quantity=20, unit="tons/week", price_min=1.4, price_max=1.8, minimum_order_quantity=5, description="Premium Hass avocados packed for export.", image_key="avocado", status="active"),
        Product(company_id=companies[1].id, supplier_name=companies[1].name, name="Arabica Coffee", category="Coffee and Tea", variety="Arabica", grade="AA", country_of_origin="Ethiopia", available_quantity=8, unit="tons/month", price_min=4.2, price_max=5.1, minimum_order_quantity=1, description="Traceable Arabica coffee lots.", image_key="coffee", status="active"),
        Product(company_id=companies[2].id, supplier_name=companies[2].name, name="Fresh Cut Flowers", category="Flowers", variety="Roses", grade="Premium", country_of_origin="Kenya", available_quantity=40, unit="boxes/week", price_min=25, price_max=40, minimum_order_quantity=10, description="Fresh cut roses and summer flowers.", image_key="flowers", status="active"),
        Product(company_id=companies[0].id, supplier_name=companies[0].name, name="Fresh Herbs", category="Herbs and Spices", variety="Mixed Herbs", grade="Export Grade", country_of_origin="Kenya", available_quantity=5, unit="tons/week", price_min=2.1, price_max=2.8, minimum_order_quantity=1, description="Fresh herbs for hospitality and retail.", image_key="tea", status="active"),
        Product(company_id=companies[0].id, supplier_name=companies[0].name, name="Macadamia Nuts", category="Nuts and Oil Seeds", variety="Kernel", grade="Premium", country_of_origin="Kenya", available_quantity=12, unit="tons/month", price_min=3.4, price_max=4.1, minimum_order_quantity=2, description="Premium macadamia nuts for export.", image_key="nuts", status="active"),
    ]
    db.add_all(products)
    await db.flush()

    rfqs = [
        RFQ(buyer_company_id=companies[3].id, buyer_name=companies[3].name, product_category="Fruits and Vegetables", product_name="Hass Avocados", quantity=20, unit="tons", destination_country="UAE", delivery_timeline="Within 14 days", target_price=1.65, additional_notes="Export grade, sea freight preferred.", status="open"),
        RFQ(buyer_company_id=companies[4].id, buyer_name=companies[4].name, product_category="Fruits and Vegetables", product_name="French Beans", quantity=12, unit="tons", destination_country="Netherlands", delivery_timeline="Within 21 days", target_price=2.2, additional_notes="GlobalG.A.P required.", status="open"),
        RFQ(buyer_company_id=companies[4].id, buyer_name=companies[4].name, product_category="Nuts and Oil Seeds", product_name="Macadamia Nuts", quantity=8, unit="tons", destination_country="Germany", delivery_timeline="30 days", target_price=3.7, additional_notes="Kernel and in-shell options.", status="awarded"),
        RFQ(buyer_company_id=companies[3].id, buyer_name=companies[3].name, product_category="Herbs and Spices", product_name="Fresh Herbs", quantity=5, unit="tons", destination_country="Saudi Arabia", delivery_timeline="10 days", target_price=2.5, additional_notes="Air freight preferred.", status="open"),
    ]
    db.add_all(rfqs)
    await db.flush()

    offers = [
        Offer(rfq_id=rfqs[0].id, exporter_company_id=companies[0].id, exporter_name=companies[0].name, price=1250, quantity=20, delivery_terms="FOB Mombasa", estimated_delivery_date="2026-06-15", notes="Can supply within 14 days.", status="accepted"),
        Offer(rfq_id=rfqs[1].id, exporter_company_id=companies[0].id, exporter_name=companies[0].name, price=2100, quantity=12, delivery_terms="FOB Nairobi", estimated_delivery_date="2026-06-20", notes="Subject to weekly harvest schedule.", status="submitted"),
        Offer(rfq_id=rfqs[2].id, exporter_company_id=companies[0].id, exporter_name=companies[0].name, price=3700, quantity=8, delivery_terms="FOB Mombasa", estimated_delivery_date="2026-07-01", notes="Premium kernel stock available.", status="accepted"),
    ]
    db.add_all(offers)
    await db.flush()

    deals = [
        Deal(buyer_company_id=companies[3].id, exporter_company_id=companies[0].id, buyer_name=companies[3].name, exporter_name=companies[0].name, rfq_id=rfqs[0].id, offer_id=offers[0].id, product_name="Hass Avocados", quantity=20, unit="tons", total_amount=25000, currency="USD", destination_country="UAE", delivery_terms="FOB Mombasa", status="funds_in_escrow", escrow_status="funded"),
        Deal(buyer_company_id=companies[4].id, exporter_company_id=companies[2].id, buyer_name=companies[4].name, exporter_name=companies[2].name, rfq_id=None, offer_id=None, product_name="Fresh Cut Flowers", quantity=40, unit="boxes", total_amount=14800, currency="USD", destination_country="Netherlands", delivery_terms="CIF Rotterdam", status="completed", escrow_status="released"),
        Deal(buyer_company_id=companies[3].id, exporter_company_id=companies[0].id, buyer_name=companies[3].name, exporter_name=companies[0].name, rfq_id=rfqs[3].id, offer_id=None, product_name="Fresh Herbs", quantity=5, unit="tons", total_amount=9400, currency="USD", destination_country="Saudi Arabia", delivery_terms="Air Freight", status="in_fulfillment", escrow_status="funded"),
    ]
    db.add_all(deals)
    await db.flush()

    db.add_all([
        Message(deal_id=deals[0].id, sender_company_id=companies[3].id, sender_name=companies[3].name, message="We need 20 tons shipped within 14 days."),
        Message(deal_id=deals[0].id, sender_company_id=companies[0].id, sender_name=companies[0].name, message="Confirmed. We can supply export-grade Hass avocados."),
        Message(deal_id=deals[0].id, sender_company_id=companies[3].id, sender_name=companies[3].name, message="Please proceed with escrow invoice."),
    ])

    db.add_all([
        EscrowTransaction(deal_id=deals[0].id, payment_reference="HL-ESC-00001", amount=25000, currency="USD", fees=375, payer_company_id=companies[3].id, recipient_company_id=companies[0].id, status="funded"),
        EscrowTransaction(deal_id=deals[1].id, payment_reference="HL-ESC-00002", amount=14800, currency="USD", fees=222, payer_company_id=companies[4].id, recipient_company_id=companies[2].id, status="released"),
        EscrowTransaction(deal_id=deals[2].id, payment_reference="HL-ESC-00003", amount=9400, currency="USD", fees=141, payer_company_id=companies[3].id, recipient_company_id=companies[0].id, status="funded"),
    ])

    db.add_all([
        FinancingRequest(exporter_company_id=companies[0].id, exporter_name=companies[0].name, requested_amount=20000, eligible_amount=8600, currency="USD", purpose="Purchase avocados from farmers for confirmed export orders.", linked_deal_id=deals[0].id, score=78, status="under_review"),
        FinancingRequest(exporter_company_id=companies[2].id, exporter_name=companies[2].name, requested_amount=5000, eligible_amount=3700, currency="USD", purpose="Packaging and shipment preparation for flower exports.", linked_deal_id=deals[1].id, score=61, status="approved"),
    ])

    await db.commit()
