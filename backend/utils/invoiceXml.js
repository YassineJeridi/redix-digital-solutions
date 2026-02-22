/**
 * Generate a Tunisian-style XML invoice (Facture Électronique)
 * Compatible with the local accounting standard structure.
 */
export function buildInvoiceXml(invoice) {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const fmtDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
    const fmtNum  = (n) => Number(n ?? 0).toFixed(3);

    const client  = invoice.client || {};
    const lineItems = (invoice.lineItems || []).map((li, i) => `
        <LigneFacture numero="${i + 1}">
            <Description>${esc(li.description)}</Description>
            <Quantite>${fmtNum(li.quantity)}</Quantite>
            <PrixUnitaire>${fmtNum(li.unitPrice)}</PrixUnitaire>
            <MontantLigne>${fmtNum(li.total)}</MontantLigne>
        </LigneFacture>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<Facture xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

    <!-- ═══════════════════════════════════════════
         EN-TÊTE FACTURE
         ═══════════════════════════════════════════ -->
    <Entete>
        <NumeroFacture>${esc(invoice.invoiceNumber)}</NumeroFacture>
        <DateEmission>${fmtDate(invoice.issueDate)}</DateEmission>
        <DateEcheance>${fmtDate(invoice.dueDate)}</DateEcheance>
        <Statut>${esc(invoice.status)}</Statut>
        <Categorie>${esc(invoice.category)}</Categorie>
        <ModePaiement>${esc(invoice.paymentMethod)}</ModePaiement>
        <Devise>${esc(invoice.currency || 'TND')}</Devise>
    </Entete>

    <!-- ═══════════════════════════════════════════
         ÉMETTEUR
         ═══════════════════════════════════════════ -->
    <Emetteur>
        <RaisonSociale>Redix Digital Solutions</RaisonSociale>
        <Adresse>Tunis, Tunisie</Adresse>
        <Email>contact@redixdigital.tn</Email>
        <Telephone>+216 XX XXX XXX</Telephone>
        <MatriculeFiscale>XXXXXXXX/X/X/XXX</MatriculeFiscale>
    </Emetteur>

    <!-- ═══════════════════════════════════════════
         CLIENT
         ═══════════════════════════════════════════ -->
    <Client>
        <RaisonSociale>${esc(client.businessName || client.ownerName || '')}</RaisonSociale>
        <Contact>${esc(client.ownerName || '')}</Contact>
        <Email>${esc(client.email || '')}</Email>
        <Telephone>${esc(client.phone || '')}</Telephone>
        <MatriculeFiscale>${esc(client.matriculeFiscale || '')}</MatriculeFiscale>
    </Client>

    <!-- ═══════════════════════════════════════════
         LIGNES DE FACTURATION
         ═══════════════════════════════════════════ -->
    <LignesFacture>${lineItems}
    </LignesFacture>

    <!-- ═══════════════════════════════════════════
         TOTAUX
         ═══════════════════════════════════════════ -->
    <Totaux>
        <SousTotal>${fmtNum(invoice.subTotal)}</SousTotal>
        <Remise>${fmtNum(invoice.discount)}</Remise>
        <TauxTVA>${fmtNum(invoice.taxRate)}</TauxTVA>
        <MontantTVA>${fmtNum(invoice.taxAmount)}</MontantTVA>
        <MontantTotal>${fmtNum(invoice.totalAmount)}</MontantTotal>
        <Devise>${esc(invoice.currency || 'TND')}</Devise>
    </Totaux>

    <!-- ═══════════════════════════════════════════
         REMARQUES
         ═══════════════════════════════════════════ -->
    ${invoice.notes ? `<Remarques>${esc(invoice.notes)}</Remarques>` : '<Remarques/>'}

</Facture>`;
}
