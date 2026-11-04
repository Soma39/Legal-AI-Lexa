import os
from typing import Dict, Any

def format_rental_agreement(data: Dict[str, Any]) -> str:
    return f"""RESIDENTIAL RENTAL / LEASE AGREEMENT

THIS RESIDENTIAL RENTAL AGREEMENT is entered into on this {data.get('commencement_date', '____')} at {data.get('state_jurisdiction', 'India')}, by and between:

LESSOR / LANDLORD:
{data.get('landlord_name', 'Landlord Name')}, residing at:
{data.get('landlord_address', 'Landlord Address')}
(hereinafter referred to as the "LESSOR", which expression shall include their legal heirs, executors, and assigns) of the ONE PART;

AND

LESSEE / TENANT:
{data.get('tenant_name', 'Tenant Name')}, residing at:
{data.get('tenant_address', 'Tenant Address')}
(hereinafter referred to as the "LESSEE", which expression shall include their legal heirs, executors, and assigns) of the OTHER PART.

WHEREAS the Lessor is the absolute and lawful owner of the residential property situated at:
{data.get('property_address', 'Premises Address')} (hereinafter referred to as the "SCHEDULED PREMISES").

NOW THEREFORE, IT IS MUTUALLY AGREED BY AND BETWEEN THE PARTIES AS FOLLOWS:

1. TERM OF LEASE:
The Lessor hereby demises unto the Lessee the Scheduled Premises for a term of {data.get('lease_term_months', 11)} months, commencing from {data.get('commencement_date', '____')}.

2. MONTHLY RENT AND CHARGES:
The Lessee shall pay to the Lessor a monthly rent of Rs. {data.get('monthly_rent', '0')}/- (Rupees only), payable in advance on or before the 5th day of each calendar month. Monthly maintenance charges, if applicable, shall be Rs. {data.get('maintenance_charge', '0')}/-.

3. INTEREST-FREE REFUNDABLE SECURITY DEPOSIT:
The Lessee has paid a sum of Rs. {data.get('security_deposit', '0')}/- to the Lessor as an interest-free refundable security deposit. This deposit shall be refunded to the Lessee upon peaceful and vacant delivery of the premises, subject to deductions for unpaid rent, electricity bills, or actual damages to the property.

4. PERMITTED USE AND MAINTENANCE:
The premises shall be used exclusively for residential purposes. The Lessee shall not sub-let, assign, or part with the possession of the premises to any third party. The Lessee shall keep the interior in good condition.

5. TERMINATION AND NOTICE PERIOD:
Either party may terminate this agreement by providing {data.get('notice_period_days', 30)} days written notice or payment of rent in lieu thereof.

STATUTORY DISCLAIMER & ADVISORY:
Under Section 107 of the Transfer of Property Act, 1882 and Section 17 of the Registration Act, 1908, any lease exceeding 11 months must be compulsorily registered with payment of applicable state stamp duty. This document is a generated draft and should be verified for local state rent control compliance.

IN WITNESS WHEREOF, the parties hereto have set their hands on the day and year first above written.

___________________________                     ___________________________
LESSOR / LANDLORD                               LESSEE / TENANT

WITNESS 1:                                      WITNESS 2:
Name: ______________________                    Name: ______________________
Address: ___________________                    Address: ___________________
"""


def format_service_agreement(data: Dict[str, Any]) -> str:
    return f"""INDEPENDENT CONTRACTOR & PROFESSIONAL SERVICES AGREEMENT

This Agreement is made on {data.get('effective_date', '____')} between:

CLIENT:
{data.get('client_name', 'Client Organization')}, having registered address at:
{data.get('client_address', 'Client Address')}

AND

SERVICE PROVIDER / CONSULTANT:
{data.get('service_provider_name', 'Service Provider')}, having address at:
{data.get('service_provider_address', 'Provider Address')}.

1. SCOPE OF SERVICES:
The Service Provider agrees to perform the following professional services:
{data.get('scope_of_services', 'Scope Details')}
The target completion date shall be {data.get('completion_date', 'TBD')}.

2. COMPENSATION & PAYMENT TERMS:
The Client shall pay a total professional fee of Rs. {data.get('total_fee', '0')}/- subject to:
{data.get('payment_terms', 'Payment milestones')}
Taxes (including GST if applicable) shall be handled per Indian statutory regulations.

3. INDEPENDENT CONTRACTOR STATUS:
Nothing in this Agreement shall be construed to create an employer-employee, agency, or partnership relationship under the Industrial Disputes Act or Indian Contract Act, 1872.

4. INTELLECTUAL PROPERTY & CONFIDENTIALITY:
All work products, deliverables, and confidential materials created in furtherance of this Agreement shall vest exclusively in the Client upon full settlement of agreed fees.

5. GOVERNING LAW & JURISDICTION:
This Agreement shall be governed by the laws of India, and courts in {data.get('governing_state', 'India')} shall have jurisdiction.

IN WITNESS WHEREOF, the authorized representatives have executed this Agreement.

___________________________                     ___________________________
For CLIENT                                      For SERVICE PROVIDER
"""


def format_legal_notice(data: Dict[str, Any]) -> str:
    return f"""LEGAL DEMAND NOTICE
(Under Section 73 of Indian Contract Act, 1872 / Civil Procedure Code)

Date: {data.get('original_transaction_date', '____')}
REGISTERED POST WITH A.D. / SPEED POST

TO:
{data.get('recipient_name', 'Recipient Name')}
{data.get('recipient_address', 'Recipient Address')}

FROM:
{data.get('sender_name', 'Sender Name')}
{data.get('sender_address', 'Sender Address')}

SUBJECT: FORMAL DEMAND NOTICE FOR PAYMENT OF OUTSTANDING DUES OF RS. {data.get('amount_due', '0')}/-

Sir/Madam,

Under instructions from and on behalf of our client/claimant, the following legal notice is hereby served upon you:

1. FACTS OF THE CLAIM:
{data.get('dispute_summary', 'Dispute Summary')}

2. BREACH AND OUTSTANDING LIABILITY:
In accordance with the agreed terms, an amount of Rs. {data.get('amount_due', '0')}/- became due and payable by you, which you have failed, neglected, and refused to discharge despite reminders.

3. FINAL CALL FOR PAYMENT:
You are hereby called upon to pay the entire outstanding amount of Rs. {data.get('amount_due', '0')}/- along with interest within {data.get('cure_period_days', 15)} days of receipt of this notice.

4. LITIGATION WARNING:
In the event of your failure to comply within the stipulated time, my client shall be constrained to initiate appropriate civil and criminal proceedings against you in a competent court of law, holding you liable for all legal costs and consequences.

A copy of this notice is retained for production before the court as proof of statutory notice.

Yours faithfully,

___________________________
{data.get('sender_name', 'Sender Name')}
(Claimant)
"""


def format_consumer_complaint(data: Dict[str, Any]) -> str:
    return f"""BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION AT {data.get('district_jurisdiction', 'DISTRICT')}.
(Complaint filed under Section 35 of the Consumer Protection Act, 2019)

COMPLAINT NO. _______ OF 2026

IN THE MATTER OF:
{data.get('complainant_name', 'Complainant Name')}
Address: {data.get('complainant_address', 'Complainant Address')}
... COMPLAINANT

VERSUS

{data.get('opposite_party_name', 'Opposite Party Name')}
Address: {data.get('opposite_party_address', 'Opposite Party Address')}
... OPPOSITE PARTY

MEMORANDUM OF COMPLAINT

1. CONSUMER STATUS:
The Complainant is a 'Consumer' within the meaning of Section 2(7) of the Consumer Protection Act, 2019, having purchased goods / hired services for consideration.

2. TRANSACTION DETAILS:
On {data.get('transaction_date', '____')}, the Complainant purchased/availed:
{data.get('goods_or_service_details', 'Details')} for total consideration of Rs. {data.get('consideration_paid', '0')}/-.

3. CAUSE OF ACTION & DEFICIENCY:
The Opposite Party indulged in deficiency of service and/or unfair trade practice:
{data.get('deficiency_description', 'Deficiency')}

4. RELIEF PRAYED FOR:
It is therefore respectfully prayed that this Hon'ble Commission may be pleased to direct the Opposite Party to:
{data.get('relief_claimed', 'Reliefs sought')}
along with litigation costs.

VERIFICATION:
I, the Complainant above named, verify that the contents of paragraphs 1 to 4 are true and correct to my knowledge.
Verified at {data.get('district_jurisdiction', 'City')} on this day.

___________________________
COMPLAINANT
"""


def format_employment_offer(data: Dict[str, Any]) -> str:
    return f"""APPOINTMENT AND OFFER OF EMPLOYMENT

Date: {data.get('joining_date', '____')}

Dear {data.get('candidate_name', 'Candidate Name')},
Address: {data.get('candidate_address', 'Address')}

On behalf of {data.get('company_name', 'Company Name')}, we are pleased to offer you appointment as:
Position: {data.get('job_title', 'Designation')}
Work Location: {data.get('work_location', 'Location')}
Joining Date: {data.get('joining_date', 'Date')}

1. REMUNERATION:
Your Annual Cost to Company (CTC) will be Rs. {data.get('annual_ctc', '0')}/- (Gross), payable monthly subject to statutory deductions (PF, TDS, Professional Tax).

2. PROBATION & CONFIRMATION:
You will be on probation for a period of {data.get('probation_months', 3)} months. Upon satisfactory completion, your employment will be confirmed in writing.

3. NOTICE PERIOD:
During probation, either party may terminate employment with 15 days notice. Following confirmation, the required notice period shall be {data.get('notice_period_days', 60)} days.

4. CONFIDENTIALITY:
You shall not disclose proprietary business data, trade secrets, or client information during or after your tenure.

Sincerely,

For {data.get('company_name', 'Company Name')}
___________________________                     I accept this offer:
Authorized Signatory                            Signature: ______________________
"""


def format_affidavit(data: Dict[str, Any]) -> str:
    return f"""GENERAL SWORN AFFIDAVIT
(To be executed on Non-Judicial Stamp Paper of appropriate State value)

BEFORE THE OATH COMMISSIONER / NOTARY PUBLIC AT {data.get('place_of_swearing', 'INDIA')}

I, {data.get('deponent_name', 'Deponent Name')}, aged about {data.get('deponent_age', '__')} years,
{data.get('deponent_father_name', 'Son/Daughter/Spouse of')},
residing at: {data.get('deponent_address', 'Address')},
do hereby solemnly affirm and declare on oath as under:

1. That I am a citizen of India and competent to swear this affidavit.
2. That this affidavit is being executed for the purpose of: {data.get('purpose_of_affidavit', 'Purpose')}.
3. That the specific facts sworn by me are as follows:
{data.get('statement_points', 'Statements')}
4. That no material facts have been concealed herein.

DEPONENT
___________________________

VERIFICATION:
Verified at {data.get('place_of_swearing', 'City')} on this {data.get('execution_date', '____')}, that the contents of above affidavit are true and correct to the best of my knowledge and belief. No part of it is false and nothing material has been concealed.

DEPONENT
___________________________
Sworn and attested before me:
NOTARY PUBLIC / OATH COMMISSIONER
"""


TEMPLATE_FORMATTERS = {
    "residential_rental_agreement": format_rental_agreement,
    "basic_service_agreement": format_service_agreement,
    "general_legal_notice": format_legal_notice,
    "consumer_complaint_draft": format_consumer_complaint,
    "employment_offer_letter": format_employment_offer,
    "general_sworn_affidavit": format_affidavit,
}
