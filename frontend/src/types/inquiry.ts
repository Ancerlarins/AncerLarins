export type InquiryStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'agreement_signed'
  | 'inspection_scheduled'
  | 'negotiating'
  | 'offer_made'
  | 'closed_won'
  | 'closed_lost';

export type QualificationType = 'qualified' | 'not_qualified' | 'cold' | 'fake';

export interface InquiryListItem {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  budget_range: string | null;
  timeline: string | null;
  financing_type: string | null;
  status: InquiryStatus;
  qualification: QualificationType | null;
  assigned_to: { id: string; full_name: string } | null;
  property: { id: string; title: string; slug: string; formatted_price: string } | null;
  created_at: string;
}

export interface InquiryDetail extends InquiryListItem {
  message: string | null;
  staff_notes: string | null;
  agent: { company_name: string; user_name: string } | null;
  user: { id: string; full_name: string } | null;
  qualified_at: string | null;
  inspection_at: string | null;
  closed_at: string | null;
  tracking_ref: string | null;
  inspection_date: string | null;
  inspection_time: string | null;
  inspection_location: string | null;
  inspection_notes: string | null;
  agreement_accepted_at: string | null;
  agreement_ip: string | null;
  agreement_terms_version: string | null;
}

export interface InquiryTrackingResult {
  tracking_ref: string;
  status: InquiryStatus;
  status_label: string;
  property: { title: string; slug: string; formatted_price: string } | null;
  inspection_date: string | null;
  inspection_time: string | null;
  inspection_location: string | null;
  agreement_accepted: boolean;
  created_at: string;
  qualified_at: string | null;
  inspection_at: string | null;
}

export interface CreateInquiryPayload {
  property_id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  budget_range?: string;
  timeline?: string;
  financing_type?: string;
  message?: string;
  source?: string;
}
