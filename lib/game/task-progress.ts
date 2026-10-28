/** Net stockpile gain, deliberately excluding starting resources. */
export function stockpileProgress(current: number, baseline: number) {
  return Math.max(0, current - baseline)
}

/** Only sites that existed when the challenge started can complete it. */
export function constructionProgress(sites: { id: number; progress: number }[], ids: number[]) {
  return sites.filter(site => ids.includes(site.id) && site.progress >= 1).length
}
