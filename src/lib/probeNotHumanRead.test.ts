import { describe, expect, it } from 'vitest'
import { probeOkIsNotHumanRead } from './probeNotHumanRead'

describe('probe status is not a human read', () => {
  it('marks the two hosts the 8 Nov re-read could not open', () => {
    expect(probeOkIsNotHumanRead('https://cbiu.gov.dm')).toBe(true)
    expect(probeOkIsNotHumanRead('https://www.cbiu.gov.dm/investment-options/')).toBe(true)
    expect(probeOkIsNotHumanRead('https://www.cnmv.es')).toBe(true)
    expect(probeOkIsNotHumanRead('https://dominica.gov.dm/')).toBe(false)
    expect(probeOkIsNotHumanRead('https://www.exteriores.gob.es/')).toBe(false)
    expect(probeOkIsNotHumanRead('not a url')).toBe(false)
  })
})
