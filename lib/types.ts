export type Quote = {
  id: string;
  user_id: string;
  prospect_name: string;
  prospect_phone: string;
  amount: number;
  pdf_path: string;
  public_token: string;
  opened: boolean;
  opened_at: string | null;
  open_count: number;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  user_id: string;
  company_name: string;
  whatsapp_phone: string;
  currency: string;
  reminder_delay_hours: number;
  reminder_template: string;
  created_at: string;
  updated_at: string;
};
