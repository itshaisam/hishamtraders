"""
Generate Fresh Proposal Documents for Hisham Traders ERP
Creates three types of proposals:
1. Visual Features Overview (for non-English speakers)
2. Formal Business Proposal (4-5 pages)
3. Simplified Presentation (existing)

Usage: python generate_proposal.py
"""

from datetime import datetime, timedelta
import os

def get_current_date():
    """Get current date formatted"""
    return datetime.now().strftime("%B %Y")

def get_expiry_date():
    """Get expiry date (30 days from now)"""
    return (datetime.now() + timedelta(days=30)).strftime("%B %Y")

def generate_visual_features():
    """Generate the visual features overview HTML"""
    print("Generating Visual Features Overview...")

    template_path = "E:\\pProjects\\hishamtraders\\demo\\features-visual.html"
    output_path = "E:\\pProjects\\hishamtraders\\demo\\features-visual-generated.html"

    # Read template
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update dates
    content = content.replace('January 2025', get_current_date())
    content = content.replace('February 2025', get_expiry_date())

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"[OK] Visual Features Overview created: {output_path}")
    return output_path

def generate_formal_proposal():
    """Generate the formal business proposal HTML"""
    print("Generating Formal Business Proposal...")

    template_path = "E:\\pProjects\\hishamtraders\\demo\\formal-proposal.html"
    output_path = "E:\\pProjects\\hishamtraders\\demo\\formal-proposal-generated.html"

    # Read template
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update dates
    content = content.replace('January 2025', get_current_date())
    content = content.replace('February 2025', get_expiry_date())

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"[OK] Formal Business Proposal created: {output_path}")
    return output_path

def generate_simplified_proposal():
    """Generate the simplified proposal HTML"""
    print("Generating Simplified Proposal...")

    template_path = "E:\\pProjects\\hishamtraders\\demo\\proposal-simplified.html"
    output_path = "E:\\pProjects\\hishamtraders\\demo\\proposal-simplified-generated.html"

    # Read template
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update dates
    current_date = get_current_date()
    expiry_date = get_expiry_date()

    content = content.replace('November 2024', current_date)
    content = content.replace('December 2024', expiry_date)

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"[OK] Simplified Proposal created: {output_path}")
    return output_path

def generate_client_final_proposal():
    """Generate the final client proposal with discount pricing"""
    print("Generating Final Client Proposal (PKR 250K with discount)...")

    template_path = "E:\\pProjects\\hishamtraders\\demo\\client-proposal-final.html"
    output_path = "E:\\pProjects\\hishamtraders\\demo\\client-proposal-final-generated.html"

    # Read template
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update dates
    content = content.replace('January 2025', get_current_date())
    content = content.replace('February 2025', get_expiry_date())

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"[OK] Final Client Proposal created: {output_path}")
    return output_path

def create_readme():
    """Create a README file explaining the different proposals"""
    readme_content = f"""# Hisham Traders ERP - Proposal Documents
Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## Available Proposals

### 1. Final Client Proposal - PKR 250K (client-proposal-final-generated.html) ⭐ RECOMMENDED
**Purpose:** Clean, simple proposal showing the agreed pricing with discount
**Features:**
- 4-page clean design
- Visual feature cards with icons
- Shows original price PKR 420K with discount to PKR 250K
- Clear payment terms breakdown
- Simple and easy to understand
- Perfect for client who agreed to basic package with extra features

**Pricing:**
- Original: PKR 420,000
- Discount: PKR 170,000 OFF (40% savings)
- Final: PKR 250,000

**Best For:** CURRENT CLIENT - Use this one!

---

### 2. Visual Features Overview (features-visual-generated.html)
**Purpose:** For non-English speaking clients or visual learners
**Features:**
- Icon-based feature presentation
- Minimal text, maximum visuals
- Easy to understand at a glance
- Colorful and engaging design
- Perfect for quick presentations

**Best For:** Initial client meetings, visual presentations, non-technical stakeholders

---

### 3. Formal Business Proposal (formal-proposal-generated.html)
**Purpose:** Professional business proposal document
**Features:**
- 5-page structured format
- Executive summary
- Detailed module descriptions
- Clear pricing structure
- Terms & conditions
- Signature section

**Best For:** Official proposal submissions, contracts, detailed presentations

---

### 4. Simplified Proposal (proposal-simplified-generated.html)
**Purpose:** Comprehensive but accessible proposal
**Features:**
- System overview with benefits
- Module-by-module breakdown
- Pricing with optional add-ons
- Technology stack information
- Payment terms

**Best For:** Technical discussions, detailed feature reviews

---

## How to Use

1. **Open any HTML file** in a web browser (Chrome, Firefox, Edge)
2. **Click "Print" button** in the top-right corner
3. **Save as PDF** from the print dialog
4. Send PDF to client via email

## Regenerating Proposals

To generate fresh proposals with updated dates:

```bash
python generate_proposal.py
```

This will create new versions with current dates in the filenames.

---

## Contact Information

Update contact details in the HTML files before sending:
- Email: info@hishamtraders.com
- Phone: +92-XXX-XXXXXXX
- Client Name: [Update in each file]

---

Generated by Hisham Traders Technology Solutions
"""

    readme_path = "E:\\pProjects\\hishamtraders\\demo\\PROPOSALS_README.md"
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)

    print(f"[OK] README created: {readme_path}")

def main():
    """Main function to generate all proposals"""
    print("\n" + "="*60)
    print("  Hisham Traders ERP - Proposal Generator")
    print("="*60 + "\n")

    # Generate all proposals
    files_created = []

    try:
        files_created.append(generate_client_final_proposal())
        files_created.append(generate_visual_features())
        files_created.append(generate_formal_proposal())
        files_created.append(generate_simplified_proposal())
        create_readme()

        print("\n" + "="*60)
        print("  SUCCESS! All proposals generated successfully")
        print("="*60)
        print("\nGenerated Files:")
        for i, file_path in enumerate(files_created, 1):
            print(f"  {i}. {os.path.basename(file_path)}")

        print("\n" + "="*60)
        print("  Next Steps:")
        print("="*60)
        print("  1. Open HTML files in browser")
        print("  2. Update client name and contact details")
        print("  3. Print to PDF")
        print("  4. Send to client")
        print("\n  See PROPOSALS_README.md for detailed instructions")
        print("="*60 + "\n")

    except Exception as e:
        print(f"\n[ERROR] {e}")
        return 1

    return 0

if __name__ == '__main__':
    exit(main())
