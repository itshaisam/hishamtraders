"""
Generate a professional Word document proposal for Hisham Traders ERP
Requires: python-docx library (install with: pip install python-docx)
"""

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

def add_page_break(doc):
    """Add a page break"""
    doc.add_page_break()

def set_cell_background(cell, fill):
    """Set cell background color"""
    shading_elm = OxmlElement('w:shd')
    shading_elm.set(qn('w:fill'), fill)
    cell._element.get_or_add_tcPr().append(shading_elm)

def create_proposal():
    doc = Document()

    # Set default font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)

    # ==================== PAGE 1: COVER PAGE ====================
    # Add logo space
    cover_para = doc.add_paragraph()
    cover_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cover_para.add_run().add_break()
    cover_para.add_run().add_break()
    cover_para.add_run().add_break()

    # Title
    title = doc.add_heading('COMMERCIAL PROPOSAL', level=1)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title.runs[0]
    title_run.font.size = Pt(36)
    title_run.font.color.rgb = RGBColor(102, 126, 234)

    # Subtitle
    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle_run = subtitle.add_run('Hisham Traders ERP System\nImport-Distribution Management Platform')
    subtitle_run.font.size = Pt(18)
    subtitle_run.font.bold = True
    subtitle.add_run().add_break()
    subtitle.add_run().add_break()

    # Proposal Details Table
    table = doc.add_table(rows=4, cols=2)
    table.alignment = WD_ALIGN_PARAGRAPH.CENTER
    table.style = 'Light Grid Accent 1'

    table.cell(0, 0).text = 'Prepared For:'
    table.cell(0, 1).text = '[Client Name]\n[Client Company]'

    table.cell(1, 0).text = 'Prepared By:'
    table.cell(1, 1).text = 'Hisham Traders Tech\nERP Solutions'

    table.cell(2, 0).text = 'Date:'
    table.cell(2, 1).text = '[Current Date]'

    table.cell(3, 0).text = 'Valid Until:'
    table.cell(3, 1).text = '[Date + 30 Days]'

    # Reference number
    ref_para = doc.add_paragraph()
    ref_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ref_para.add_run().add_break()
    ref_para.add_run().add_break()
    ref_run = ref_para.add_run('Proposal Reference: HTERP-2025-[XXX]')
    ref_run.font.size = Pt(10)
    ref_run.font.color.rgb = RGBColor(128, 128, 128)

    add_page_break(doc)

    # ==================== PAGE 2: EXECUTIVE SUMMARY ====================
    doc.add_heading('Executive Summary', level=1)

    # The Challenge
    doc.add_heading('The Challenge', level=2)
    doc.add_paragraph(
        'Import-distribution businesses face critical operational inefficiencies: manual inventory tracking '
        'leading to stockouts and overstocking, fragmented purchase order management, lack of real-time '
        'visibility across multiple warehouses, inefficient credit and recovery management, and time-consuming '
        'manual reporting. These challenges result in lost revenue opportunities, poor cash flow, and inability '
        'to scale operations effectively.'
    )

    # Our Solution
    doc.add_heading('Our Solution', level=2)
    doc.add_paragraph(
        'Hisham Traders ERP is a comprehensive, purpose-built management platform designed specifically for '
        'import-distribution businesses. The system provides end-to-end digitalization from procurement to '
        'payment collection, with industry-specific features like import documentation tracking, landed cost '
        'calculation, batch/lot traceability, multi-warehouse management, credit limit enforcement, and '
        'intelligent recovery scheduling.'
    )
    doc.add_paragraph(
        'Built with modern web technologies, our ERP offers a responsive interface accessible from desktop, '
        'tablet, and mobile devices, ensuring your team can work efficiently from anywhere.'
    )

    # Key Benefits
    doc.add_heading('Key Benefits', level=2)
    benefits_table = doc.add_table(rows=4, cols=2)
    benefits_table.style = 'Light Grid Accent 1'

    benefits = [
        ('40% Efficiency Gain', 'Automation eliminates manual data entry and reduces processing time'),
        ('25% Better Inventory', 'Improved turnover and 60% reduction in stockout incidents'),
        ('30% Faster Recovery', 'Reduce DSO from 45 to 32 days through systematic collection'),
        ('Real-Time Visibility', 'Instant access to inventory, sales, and financial data')
    ]

    for idx, (title, desc) in enumerate(benefits):
        row_cells = benefits_table.rows[idx].cells
        row_cells[0].text = title
        row_cells[1].text = desc
        row_cells[0].paragraphs[0].runs[0].font.bold = True

    # Implementation Timeline
    doc.add_heading('Implementation Timeline', level=2)
    timeline = [
        ('Week 1-2', 'Requirements & Design', 'Gather requirements, configure system, design workflows'),
        ('Week 3-6', 'Development & Configuration', 'System setup, data migration, customization'),
        ('Week 7-8', 'UAT & Training', 'User acceptance testing and comprehensive training'),
        ('Week 9-10', 'Go-Live & Support', 'System launch with ongoing support and stabilization')
    ]

    for phase, title, desc in timeline:
        p = doc.add_paragraph()
        p.add_run(f'{phase}: ').bold = True
        p.add_run(f'{title}\n').bold = True
        p.add_run(desc)
        p.style = 'List Bullet'

    add_page_break(doc)

    # ==================== PAGE 3: PACKAGE OPTIONS ====================
    doc.add_heading('Package Options', level=1)
    doc.add_paragraph(
        'Choose the tier that best matches your business needs and budget. All packages include on-premise '
        'deployment, training, and 90 days support.'
    )

    # Tier 1: Essential
    doc.add_heading('Tier 1: Essential Operations', level=2)
    tier1_para = doc.add_paragraph()
    tier1_run = tier1_para.add_run('$1,150')
    tier1_run.font.size = Pt(16)
    tier1_run.font.bold = True
    tier1_run.font.color.rgb = RGBColor(0, 112, 192)
    tier1_para.add_run(' | 4-6 weeks delivery')

    doc.add_paragraph('Foundation tier for small wholesalers starting digital transformation.')

    doc.add_heading('Core Features:', level=3)
    features_tier1 = [
        'Basic single-warehouse inventory tracking',
        'Simple purchase order management',
        'Sales invoicing with auto stock deduction',
        'Client management with balance tracking',
        'Payment tracking & basic reports',
        '3 user roles (Admin, Sales, Warehouse)',
        'Excel export functionality'
    ]
    for feature in features_tier1:
        doc.add_paragraph(feature, style='List Bullet')

    doc.add_paragraph()

    # Tier 2: Standard (Recommended)
    doc.add_heading('Tier 2: Complete ERP Solution (RECOMMENDED)', level=2)
    tier2_para = doc.add_paragraph()
    tier2_run = tier2_para.add_run('$1,850')
    tier2_run.font.size = Pt(16)
    tier2_run.font.bold = True
    tier2_run.font.color.rgb = RGBColor(112, 48, 160)
    tier2_para.add_run(' | 6-8 weeks delivery')

    doc.add_paragraph('Everything you need for professional import-distribution business.')

    doc.add_heading('All Essential Features PLUS:', level=3)
    features_tier2 = [
        'Multi-warehouse management with bin locations',
        'Import documentation tracking (customs, taxes, shipping)',
        'Batch/lot tracking with expiry alerts',
        'Credit limit enforcement with automatic warnings',
        'Weekly recovery schedule with aging analysis',
        'Gate pass system (auto/manual approval workflow)',
        'Complete audit trail and activity logging',
        '5 user roles (Admin, Warehouse, Sales, Accountant, Recovery)',
        'Advanced reporting and analytics'
    ]
    for feature in features_tier2:
        doc.add_paragraph(feature, style='List Bullet')

    doc.add_paragraph()

    # Tier 3: Premium
    doc.add_heading('Tier 3: Enterprise Features', level=2)
    tier3_para = doc.add_paragraph()
    tier3_run = tier3_para.add_run('$3,400')
    tier3_run.font.size = Pt(16)
    tier3_run.font.bold = True
    tier3_run.font.color.rgb = RGBColor(192, 0, 0)
    tier3_para.add_run(' | 10-12 weeks delivery')

    doc.add_paragraph('Advanced automation and multi-tenant capabilities for enterprises.')

    doc.add_heading('All Standard Features PLUS:', level=3)
    features_tier3 = [
        'Barcode/QR code scanning for fast stock transactions',
        'Mobile apps (iOS/Android) for field operations',
        'WhatsApp/SMS integration for automated reminders',
        'Advanced AI-powered analytics and demand forecasting',
        'FBR E-Invoice integration (Pakistan tax compliance)',
        'Multi-currency support for international transactions',
        'Customer/Supplier self-service portals',
        'Multi-tenant SaaS capability (host multiple businesses)',
        'Priority support with 99.9% SLA guarantee'
    ]
    for feature in features_tier3:
        doc.add_paragraph(feature, style='List Bullet')

    add_page_break(doc)

    # ==================== PAGE 4: ADDITIONAL SERVICES ====================
    doc.add_heading('Additional Services & Support', level=1)

    doc.add_heading('À La Carte Services', level=2)
    doc.add_paragraph('Additional services available for all tiers:')

    services_table = doc.add_table(rows=7, cols=3)
    services_table.style = 'Medium Grid 1 Accent 1'

    # Header row
    hdr_cells = services_table.rows[0].cells
    hdr_cells[0].text = 'Service'
    hdr_cells[1].text = 'Description'
    hdr_cells[2].text = 'Price'

    services = [
        ('Extended Support', '12-month priority support package', '$180/year'),
        ('Advanced Training', 'Role-specific training (per role)', '$90'),
        ('Custom Reports', 'Bespoke report development', '$55 each'),
        ('Data Migration', 'Legacy system data import', '$110 - 270'),
        ('API Integration', 'Third-party system integration', '$180 - 540'),
        ('Hosting Setup', 'Cloud/VPS server setup & configuration', '$145')
    ]

    for idx, (service, desc, price) in enumerate(services, 1):
        row_cells = services_table.rows[idx].cells
        row_cells[0].text = service
        row_cells[1].text = desc
        row_cells[2].text = price

    doc.add_paragraph()

    doc.add_heading('Support Tiers', level=2)
    support_table = doc.add_table(rows=4, cols=3)
    support_table.style = 'Light List Accent 1'

    hdr_cells = support_table.rows[0].cells
    hdr_cells[0].text = 'Tier'
    hdr_cells[1].text = 'Coverage'
    hdr_cells[2].text = 'Response Time'

    support_data = [
        ('Basic (Included)', 'Email support, bug fixes', '48-72 hours'),
        ('Standard', 'Email + Phone, updates', '24-48 hours'),
        ('Premium', '24/7 support, dedicated manager', '4-12 hours')
    ]

    for idx, (tier, coverage, response) in enumerate(support_data, 1):
        row_cells = support_table.rows[idx].cells
        row_cells[0].text = tier
        row_cells[1].text = coverage
        row_cells[2].text = response

    add_page_break(doc)

    # ==================== PAGE 5: TERMS & CONDITIONS ====================
    doc.add_heading('Terms & Conditions', level=1)

    doc.add_heading('Payment Terms', level=2)
    payment_terms = [
        '30% advance payment upon contract signing',
        '40% payment upon UAT completion and training delivery',
        '30% final payment upon successful go-live',
        'Additional services billed separately as per agreement',
        'Payment via bank transfer or cheque in favor of Hisham Traders Tech'
    ]
    for term in payment_terms:
        doc.add_paragraph(term, style='List Bullet')

    doc.add_heading('Deliverables', level=2)
    deliverables = [
        'Fully functional ERP system as per selected tier',
        'Complete source code access',
        'User manuals and technical documentation',
        'On-site training for all user roles',
        '90 days post-launch support (bug fixes and assistance)',
        'Data migration from Excel or existing systems'
    ]
    for item in deliverables:
        doc.add_paragraph(item, style='List Bullet')

    doc.add_heading('Client Responsibilities', level=2)
    responsibilities = [
        'Provide necessary hardware/server infrastructure',
        'Assign dedicated team for requirements gathering and UAT',
        'Provide existing data in Excel or accessible format',
        'Ensure availability of key stakeholders during implementation',
        'Network and database access for development team'
    ]
    for resp in responsibilities:
        doc.add_paragraph(resp, style='List Bullet')

    doc.add_heading('Warranty & Maintenance', level=2)
    doc.add_paragraph(
        'The system includes a 90-day warranty covering all bugs and functional issues discovered post go-live. '
        'Extended support packages are available for continued maintenance, updates, and enhancements.'
    )

    doc.add_heading('Intellectual Property', level=2)
    doc.add_paragraph(
        'Upon full payment, the client receives full ownership of the deployed system instance and source code. '
        'Hisham Traders Tech retains the right to use the base framework for other projects.'
    )

    doc.add_heading('Validity', level=2)
    doc.add_paragraph(
        'This proposal is valid for 30 days from the date of issuance. Pricing and timelines are subject to '
        'change after the validity period.'
    )

    add_page_break(doc)

    # ==================== PAGE 6: ACCEPTANCE & SIGNATURE ====================
    doc.add_heading('Proposal Acceptance', level=1)

    doc.add_paragraph(
        'By signing below, both parties agree to the terms and conditions outlined in this proposal.'
    )

    doc.add_paragraph()
    doc.add_paragraph()

    # Client signature section
    doc.add_heading('Client Acceptance', level=2)
    sig_table1 = doc.add_table(rows=5, cols=2)
    sig_table1.style = 'Table Grid'

    sig_table1.cell(0, 0).text = 'Company Name:'
    sig_table1.cell(0, 1).text = '________________________________'

    sig_table1.cell(1, 0).text = 'Authorized Signatory:'
    sig_table1.cell(1, 1).text = '________________________________'

    sig_table1.cell(2, 0).text = 'Designation:'
    sig_table1.cell(2, 1).text = '________________________________'

    sig_table1.cell(3, 0).text = 'Signature:'
    sig_table1.cell(3, 1).text = '________________________________'

    sig_table1.cell(4, 0).text = 'Date:'
    sig_table1.cell(4, 1).text = '________________________________'

    doc.add_paragraph()
    doc.add_paragraph()

    # Provider signature section
    doc.add_heading('Service Provider', level=2)
    sig_table2 = doc.add_table(rows=5, cols=2)
    sig_table2.style = 'Table Grid'

    sig_table2.cell(0, 0).text = 'Company Name:'
    sig_table2.cell(0, 1).text = 'Hisham Traders Tech'

    sig_table2.cell(1, 0).text = 'Authorized Signatory:'
    sig_table2.cell(1, 1).text = '[Name]'

    sig_table2.cell(2, 0).text = 'Designation:'
    sig_table2.cell(2, 1).text = 'Director'

    sig_table2.cell(3, 0).text = 'Signature:'
    sig_table2.cell(3, 1).text = '________________________________'

    sig_table2.cell(4, 0).text = 'Date:'
    sig_table2.cell(4, 1).text = '________________________________'

    doc.add_paragraph()
    doc.add_paragraph()

    # Contact information
    doc.add_heading('Contact Information', level=2)
    contact_para = doc.add_paragraph()
    contact_para.add_run('Email: ').bold = True
    contact_para.add_run('info@hishamtraders.com\n')
    contact_para.add_run('Phone: ').bold = True
    contact_para.add_run('+92 300 1234567\n')
    contact_para.add_run('Website: ').bold = True
    contact_para.add_run('www.hishamtraders.com')

    # Save document
    doc.save('e:\\pProjects\\hishamtraders\\demo\\Hisham_Traders_ERP_Proposal.docx')
    print("[SUCCESS] Proposal document created successfully!")
    print("Location: demo/Hisham_Traders_ERP_Proposal.docx")

if __name__ == '__main__':
    try:
        create_proposal()
    except ImportError:
        print("Error: python-docx library not found")
        print("Please install it using: pip install python-docx")
    except Exception as e:
        print(f"Error creating document: {e}")
