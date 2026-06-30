import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/format";

type TrackResult = {
  quote_id: string;
  pdf_path: string;
  prospect_name: string;
  amount: number;
  opened_at: string;
  open_count: number;
};

export const dynamic = "force-dynamic";

export default async function ReadQuotePage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("track_quote_open", {
    p_token: params.token,
  });
  const tracked = data as TrackResult[] | null;

  if (error || !tracked || tracked.length === 0) {
    notFound();
  }

  const quote = tracked[0];
  const { data: signed, error: signedError } = await supabase.storage
    .from("quotes-pdf")
    .createSignedUrl(quote.pdf_path, 60 * 30);

  if (signedError || !signed?.signedUrl) {
    notFound();
  }

  return (
    <main className="reader">
      <header>
        <div>
          <strong>Devis pour {quote.prospect_name}</strong>
          <span className="muted" style={{ display: "block", color: "#b9cac5" }}>
            {formatMoney(quote.amount)}
          </span>
        </div>
        <span>WaQuote</span>
      </header>

      <iframe title={`Devis ${quote.prospect_name}`} src={signed.signedUrl} />
    </main>
  );
}
