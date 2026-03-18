import { useState } from 'react'
import { IngestionSummary } from '../utils/ingestion'
import { TierOption } from '../utils/tiers'
import { DAYS_PER_MONTH } from '../data/pricing'
import { fmtCurrency } from '../utils/currency'
import { usePricing } from '../contexts/PricingContext'

interface Props {
  summary: IngestionSummary
  licenceLabel: string
  defenderSavedMonthlyUsd: number
  defenderEnabled: boolean
  e5SavedMonthlyUsd: number
  commitmentOptions: TierOption[]
}

function SavingBadge({ pct }: { pct: number }) {
  if (pct <= 0) return <span className="text-light/30">—</span>
  return (
    <span className="inline-flex items-center gap-0.5 text-primary font-semibold text-xs">
      <span aria-hidden="true">▼</span>
      <span className="sr-only">Saving </span>
      {pct.toFixed(1)}%
    </span>
  )
}

function CostCell({ usd, highlight, fxRate, displayCurrency, eurRate }: {
  usd: number; highlight?: boolean; fxRate: number; displayCurrency: 'GBP' | 'USD' | 'EUR'; eurRate: number
}) {
  return (
    <td className={`px-4 py-2.5 text-right font-mono text-sm ${highlight ? 'font-bold text-light' : 'text-light/70'}`}>
      {fmtCurrency(usd, displayCurrency, fxRate, eurRate, 0)}
    </td>
  )
}

function SavingCell({ usd, fxRate, displayCurrency, eurRate }: {
  usd: number; fxRate: number; displayCurrency: 'GBP' | 'USD' | 'EUR'; eurRate: number
}) {
  if (usd <= 0) return <td className="px-4 py-2.5 text-right text-light/30 text-sm">—</td>
  return (
    <td className="px-4 py-2.5 text-right font-mono text-sm text-primary font-medium">
      −{fmtCurrency(usd, displayCurrency, fxRate, eurRate, 0)}
    </td>
  )
}

export function CostSummary({
  summary,
  licenceLabel,
  defenderSavedMonthlyUsd,
  defenderEnabled,
  e5SavedMonthlyUsd,
  commitmentOptions,
}: Props) {
  const { fxRate, displayCurrency, eurRate } = usePricing()
  const tierOptions = commitmentOptions.filter(o => !o.isPayg)
  const defaultTier = commitmentOptions.find(o => o.isRecommended && !o.isPayg) ?? tierOptions[0]
  const [selectedTierLabel, setSelectedTierLabel] = useState<string>(defaultTier?.label ?? '')

  const selectedTier = tierOptions.find(o => o.label === selectedTierLabel) ?? tierOptions[0]

  function fmt(usd: number) {
    return fmtCurrency(usd, displayCurrency, fxRate, eurRate, 0)
  }

  // ── Monthly base costs ──────────────────────────────────────────────────
  const analyticsMonthly = summary.analyticsDailyCostUsd * DAYS_PER_MONTH
  const dataLakeMonthly  = summary.dataLakeDailyCostUsd  * DAYS_PER_MONTH
  const retentionMonthly = summary.retentionMonthlyCostUsd
  const totalPayg        = analyticsMonthly + dataLakeMonthly + retentionMonthly

  // ── Savings ─────────────────────────────────────────────────────────────
  const totalSavings = defenderSavedMonthlyUsd + e5SavedMonthlyUsd

  // ── Scenario costs ───────────────────────────────────────────────────────
  // Col 1: pure PAYG, no savings
  const paygTotal = totalPayg

  // Col 2: PAYG + active savings (XDR / Defender)
  const withSavingsTotal = Math.max(0, totalPayg - totalSavings)

  // Col 3: commitment tier on analytics + data lake + retention + savings
  const analyticsCommitmentMonthly = selectedTier ? selectedTier.monthlyCostUsd : analyticsMonthly
  const commitmentBaseTotal = analyticsCommitmentMonthly + dataLakeMonthly + retentionMonthly
  const commitmentAnalyticsSaving = analyticsMonthly - analyticsCommitmentMonthly
  const commitmentOptimisedTotal = Math.max(0, commitmentBaseTotal - totalSavings)

  // ── vs-PAYG percentages ──────────────────────────────────────────────────
  const savingsPct    = paygTotal > 0 ? ((paygTotal - withSavingsTotal)    / paygTotal) * 100 : 0
  const optimisedPct  = paygTotal > 0 ? ((paygTotal - commitmentOptimisedTotal) / paygTotal) * 100 : 0

  const isEmpty = summary.rows.length === 0

  if (isEmpty) {
    return (
      <div className="bg-surface rounded-xl border border-white/10 shadow-sm px-6 py-10 text-center">
        <p className="text-sm text-light/40">Select log sources above to see your total cost summary.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl border border-white/10 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-light">Total Monthly Cost Summary</h2>
          <p className="text-sm text-light/50 mt-0.5">
            Compare PAYG baseline against your active savings and commitment tier options.
          </p>
        </div>

        {/* Commitment tier selector */}
        {tierOptions.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <label htmlFor="summary-tier-select" className="text-xs text-light/50 whitespace-nowrap">
              Compare tier:
            </label>
            <select
              id="summary-tier-select"
              value={selectedTierLabel}
              onChange={e => setSelectedTierLabel(e.target.value)}
              className="text-sm border border-white/15 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-light"
            >
              {tierOptions.map(o => (
                <option key={o.label} value={o.label}>
                  {o.label}{o.isRecommended ? ' ★ Recommended' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Monthly cost scenario comparison">
          <thead>
            <tr className="bg-dark text-xs uppercase tracking-wide text-light/50">
              <th className="px-4 py-3 text-left font-medium">Cost component</th>
              <th className="px-4 py-3 text-right font-medium">PAYG</th>
              <th className="px-4 py-3 text-right font-medium">
                <span className="hidden sm:inline">With </span>savings
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {selectedTier ? selectedTier.tier!.gbPerDay.toLocaleString() + ' GB/day' : '—'}
                <span className="hidden sm:inline"> + savings</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">

            {/* Analytics ingestion */}
            <tr>
              <td className="px-4 py-2.5 text-light/70">Analytics ingestion</td>
              <CostCell usd={analyticsMonthly} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
              <CostCell usd={analyticsMonthly} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
              <td className="px-4 py-2.5 text-right font-mono text-sm text-light/70">
                {selectedTier
                  ? <span className="text-primary">{fmt(analyticsCommitmentMonthly)}</span>
                  : fmt(analyticsMonthly)}
                {commitmentAnalyticsSaving > 0 && (
                  <span className="block text-[10px] text-primary/70 font-normal">
                    −{fmt(commitmentAnalyticsSaving)} committed
                  </span>
                )}
              </td>
            </tr>

            {/* Data Lake ingestion */}
            <tr>
              <td className="px-4 py-2.5 text-light/70">Data Lake ingestion</td>
              <CostCell usd={dataLakeMonthly} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
              <CostCell usd={dataLakeMonthly} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
              <CostCell usd={dataLakeMonthly} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
            </tr>

            {/* Extended retention — three conditional rows */}
            {summary.analyticsExtendedRetentionMonthlyCostUsd > 0 && (
              <tr>
                <td className="px-4 py-2.5 text-light/70">Analytics extended retention</td>
                <CostCell usd={summary.analyticsExtendedRetentionMonthlyCostUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
                <CostCell usd={summary.analyticsExtendedRetentionMonthlyCostUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
                <CostCell usd={summary.analyticsExtendedRetentionMonthlyCostUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
              </tr>
            )}
            {summary.dataLakeMirrorRetentionMonthlyCostUsd > 0 && (
              <tr>
                <td className="px-4 py-2.5 text-light/70">Data Lake mirror retention</td>
                <CostCell usd={summary.dataLakeMirrorRetentionMonthlyCostUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
                <CostCell usd={summary.dataLakeMirrorRetentionMonthlyCostUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
                <CostCell usd={summary.dataLakeMirrorRetentionMonthlyCostUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
              </tr>
            )}
            {summary.dataLakeNativeRetentionMonthlyCostUsd > 0 && (
              <tr>
                <td className="px-4 py-2.5 text-light/70">Data Lake long-term retention</td>
                <CostCell usd={summary.dataLakeNativeRetentionMonthlyCostUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
                <CostCell usd={summary.dataLakeNativeRetentionMonthlyCostUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
                <CostCell usd={summary.dataLakeNativeRetentionMonthlyCostUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
              </tr>
            )}

            {/* Divider row — savings */}
            <tr className="bg-dark">
              <td colSpan={4} className="px-4 py-1.5 text-[10px] font-semibold text-light/40 uppercase tracking-wider">
                Savings applied
              </td>
            </tr>

            {/* Defender for Servers saving */}
            <tr>
              <td className="px-4 py-2.5 text-light/70">
                Defender for Servers P2
                {!defenderEnabled && (
                  <span className="ml-1.5 text-[10px] text-light/40">(not enabled)</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right text-light/30 text-sm">—</td>
              <SavingCell usd={defenderSavedMonthlyUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
              <SavingCell usd={defenderSavedMonthlyUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
            </tr>

            {/* M365 E5 data grant saving */}
            <tr>
              <td className="px-4 py-2.5 text-light/70">
                M365 E5 data grant (Entra ID &amp; MDCA)
                {e5SavedMonthlyUsd === 0 && (
                  <span className="ml-1.5 text-[10px] text-light/40">
                    {licenceLabel === 'None / M365 E1' || licenceLabel === 'Microsoft 365 E3'
                      ? '(no qualifying licence)'
                      : '(no eligible sources)'}
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right text-light/30 text-sm">—</td>
              <SavingCell usd={e5SavedMonthlyUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
              <SavingCell usd={e5SavedMonthlyUsd} fxRate={fxRate} displayCurrency={displayCurrency} eurRate={eurRate} />
            </tr>

            {/* Total rows */}
            <tr className="border-t-2 border-white/10" style={{ background: '#252838' }}>
              <td className="px-4 py-4 font-semibold text-light/50 text-xs uppercase tracking-widest">Monthly total</td>
              <td className="px-4 py-4 text-right">
                <span className="text-2xl font-bold font-mono text-light">{fmt(paygTotal)}</span>
              </td>
              <td className="px-4 py-4 text-right">
                <span className={`text-2xl font-bold font-mono ${totalSavings > 0 ? 'text-primary' : 'text-light'}`}>
                  {fmt(withSavingsTotal)}
                </span>
              </td>
              <td className="px-4 py-4 text-right">
                <span className={`text-2xl font-bold font-mono ${optimisedPct > 0 ? 'text-primary' : 'text-light'}`}>
                  {fmt(commitmentOptimisedTotal)}
                </span>
                {optimisedPct > 0 && (
                  <span className="ml-2 inline-block bg-accent text-dark text-xs font-bold px-1.5 py-0.5 rounded">
                    ▼ {optimisedPct.toFixed(0)}%
                  </span>
                )}
              </td>
            </tr>

            {/* vs PAYG row */}
            <tr>
              <td className="px-4 py-2 text-xs text-light/40">vs PAYG</td>
              <td className="px-4 py-2 text-right text-xs text-light/40">baseline</td>
              <td className="px-4 py-2 text-right"><SavingBadge pct={savingsPct} /></td>
              <td className="px-4 py-2 text-right"><SavingBadge pct={optimisedPct} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div className="px-6 py-3 border-t border-white/10 text-[11px] text-light/40 leading-relaxed">
        Analytics ingestion shown at PAYG rate; commitment tier reduces this cost.
        Licence benefits (E5 data grant and Defender for Servers) are billing credits — all data is still ingested.
        Credits are estimated at the PAYG Analytics rate; the E5 grant applies to Entra ID and MDCA sources only.
        Data Lake and retention costs are unchanged by commitment tier or licence benefits.
        Retention shown as monthly charge; all other costs derived from daily estimates × {DAYS_PER_MONTH} days.
      </div>
    </div>
  )
}
