/** Scoped styles shared by the standalone download and the printable preview. */
export const invoiceStyles = `
.club-invoice{box-sizing:border-box;width:100%;max-width:880px;margin:0 auto;padding:40px;background:#fff;color:#23392e;font:14px/1.6 system-ui,sans-serif;overflow-wrap:anywhere;border:1px solid #e5e9e0;border-top:6px solid #163d30;border-radius:12px}
.club-invoice *{box-sizing:border-box}
.club-invoice h1,.club-invoice h2,.club-invoice h3,.club-invoice p,.club-invoice dl,.club-invoice dd{margin:0}
.club-invoice h1{font-size:24px;line-height:1.3;letter-spacing:-.7px;color:#163d30}
.club-invoice h2{font-size:22px;line-height:1.3;letter-spacing:-.5px;margin:8px 0}
.club-invoice h3{font:600 11px/1.4 system-ui,sans-serif;text-transform:uppercase;letter-spacing:1.2px;color:#61705e;margin-bottom:12px}
.club-invoice .invoice-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding-bottom:24px;border-bottom:1px solid #e5e9e0}
.club-invoice .eyebrow{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#61705e}
.club-invoice .badge{display:inline-block;border:1px solid #b9cba9;border-radius:999px;padding:5px 12px;background:#edf3e2;color:#163d30;font-size:11px;font-weight:700;white-space:nowrap}
.club-invoice .badge.voided{border-color:#c5ccc5;background:#f0f2ef;color:#465348}
.club-invoice .invoice-title{padding:24px 0}
.club-invoice .metadata{display:flex;flex-wrap:wrap;gap:16px 40px;font-size:12px}
.club-invoice dt{color:#61705e;font-size:11px}
.club-invoice dd{font-variant-numeric:tabular-nums}
.club-invoice .parties{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;padding:22px;background:#f6f7f3;border:1px solid #e5e9e0;border-radius:8px}
.club-invoice .party-name{font-weight:650;margin-bottom:6px}
.club-invoice .address{white-space:pre-line}
.club-invoice .secondary{font-size:12px;color:#61705e}
.club-invoice .line-items{margin-top:28px;overflow-x:auto}
.club-invoice table{width:100%;border-collapse:collapse;font-size:12px}
.club-invoice caption{text-align:left;font-weight:650;margin-bottom:10px}
.club-invoice th{text-align:left;color:#61705e;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;border-bottom:2px solid #163d30;padding:10px 8px}
.club-invoice td{padding:16px 8px;border-bottom:1px solid #e5e9e0;vertical-align:top}
.club-invoice th:first-child,.club-invoice td:first-child{padding-left:0}
.club-invoice .numeric{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.club-invoice .totals{display:grid;gap:8px;max-width:330px;margin:24px 0 0 auto}
.club-invoice .totals>div{display:flex;justify-content:space-between;gap:24px}
.club-invoice .totals dt{font-size:12px}
.club-invoice .totals .grand-total{background:#163d30;color:#fff;border-radius:6px;padding:12px 16px;margin-top:6px;font-size:20px;font-weight:650}
.club-invoice .grand-total dt{font-size:13px;color:#fff;align-self:center}
.club-invoice .document-status{font-size:12px;margin-top:22px;font-weight:600}
.club-invoice .warning{margin-top:24px;padding:14px 16px;border:1px solid #d4bf91;border-radius:6px;background:#fffaf0;color:#6b501e;font-size:12px}
.club-invoice .invoice-footer{margin-top:28px;padding-top:18px;border-top:1px solid #e5e9e0;font-size:11px;color:#61705e}
.club-invoice .invoice-footer strong{color:#163d30}
@media(max-width:600px){.club-invoice{padding:20px 16px;border-radius:8px}.club-invoice .invoice-header{gap:12px}.club-invoice h1{font-size:19px}.club-invoice .parties{grid-template-columns:1fr;padding:16px}.club-invoice table{min-width:520px}.club-invoice .totals{max-width:none}.club-invoice .badge{padding:4px 8px;font-size:10px}}
@media print{.club-invoice{max-width:none;padding:0;border:0;border-radius:0;font-size:11px;print-color-adjust:exact;-webkit-print-color-adjust:exact}.club-invoice .invoice-header,.club-invoice .parties,.club-invoice tr,.club-invoice .totals,.club-invoice .warning{break-inside:avoid}.club-invoice .line-items{overflow:visible}.club-invoice table{min-width:0}.club-invoice .parties{grid-template-columns:repeat(2,minmax(0,1fr))}.club-invoice .totals{max-width:330px}.club-invoice .invoice-header{padding-bottom:16px}}
`
