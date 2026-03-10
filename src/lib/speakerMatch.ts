import type { SpeakerIdentityResult } from '../types'

/**
 * Attempt to match a logged-in user's full name against
 * the list of speaker names Claude extracted from the transcript.
 *
 * Strategy:
 *   1. Tokenise full_name into lowercase parts ("zach", "roberts")
 *   2. For each detected speaker, check if any token is a substring
 *      of the speaker name (or vice versa)
 *   3. If exactly one match → auto-assign (matched: true)
 *   4. If zero or multiple matches → surface all candidates to the user
 */
export function matchSpeakerToUser(
  fullName: string,
  detectedSpeakers: string[]
): SpeakerIdentityResult {
  const tokens = fullName
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 1) // skip single-char initials

  const matches = detectedSpeakers.filter(speaker => {
    const s = speaker.toLowerCase()
    return tokens.some(token => s.includes(token) || token.includes(s.split(' ')[0]))
  })

  if (matches.length === 1) {
    return { matched: true, speakerName: matches[0] }
  }

  return { matched: false, candidates: detectedSpeakers }
}
